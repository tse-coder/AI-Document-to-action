import { lookup } from "node:dns/promises";
import net from "node:net";
import postgres from "postgres";

type PostgresClient = ReturnType<typeof postgres>;

const RACE_ATTEMPT_TIMEOUT_MS = 15_000;

/**
 * Supabase's pooler resolves to several IPs, and on some networks an
 * individual IP can black-hole TCP SYNs for 20s+. Connecting to all resolved
 * addresses in parallel and keeping the first socket that succeeds removes
 * those multi-second stalls from every cold connection.
 */
async function createRacingSocket(options: { host: string[]; port: number[] }): Promise<net.Socket> {
  const host = options.host[0];
  const port = Number(options.port[0]) || 5432;
  const addresses = net.isIP(host)
    ? [host]
    : (await lookup(host, { all: true })).map((entry) => entry.address);
  const sockets: net.Socket[] = [];

  const attempts = addresses.map(
    (address) =>
      new Promise<net.Socket>((resolve, reject) => {
        const socket = net.createConnection({ host: address, port });
        sockets.push(socket);
        const timer = setTimeout(() => {
          socket.destroy(Object.assign(new Error(`connect timeout ${address}:${port}`), { code: "CONNECT_TIMEOUT" }));
        }, RACE_ATTEMPT_TIMEOUT_MS);
        socket.once("connect", () => {
          clearTimeout(timer);
          resolve(socket);
        });
        socket.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
      }),
  );

  try {
    const winner = await Promise.any(attempts);
    for (const socket of sockets) {
      if (socket !== winner) socket.destroy();
    }
    return winner;
  } catch (error) {
    for (const socket of sockets) socket.destroy();
    throw Object.assign(new Error(`Could not reach ${host}:${port}`), {
      code: "CONNECT_TIMEOUT",
      cause: error,
    });
  }
}
const globalForPostgres = globalThis as typeof globalThis & {
  postgresClient?: PostgresClient;
};
let moduleClient: PostgresClient | undefined;

function getClient(): PostgresClient {
  if (moduleClient) return moduleClient;
  if (globalForPostgres.postgresClient) {
    moduleClient = globalForPostgres.postgresClient;
    return moduleClient;
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for backend database access");
  moduleClient = postgres(databaseUrl, {
    max: 1,
    // Keep the single pooled connection open. The path to the Supabase region
    // has high latency jitter, so reconnecting after a short idle period is far
    // less reliable than reusing a warm connection.
    idle_timeout: 0,
    keep_alive: 60,
    // A cold TCP handshake to the Supabase pooler can take well over 10s on
    // slow networks. The previous 10s limit produced intermittent health
    // failures even though the database was reachable.
    connect_timeout: 30,
    prepare: false,
    // PostgreSQL DATE values are calendar dates, not instants. Preserve their
    // wire representation so API serialization remains YYYY-MM-DD in every
    // server timezone instead of converting them through JavaScript Date.
    types: {
      date: {
        to: 1082,
        from: [1082],
        serialize: (value: string | Date) =>
          value instanceof Date ? value.toISOString().slice(0, 10) : value,
        parse: (value: string) => value,
      },
    },
    // Supported at runtime but missing from postgres.js's published types.
    socket: createRacingSocket,
  } as unknown as Parameters<typeof postgres>[1]);
  if (process.env.NODE_ENV !== "production") globalForPostgres.postgresClient = moduleClient;
  return moduleClient;
}

/**
 * Lazy shared Postgres client. Laziness lets /api/health return a JSON
 * DATABASE_UNAVAILABLE response when DATABASE_URL has not been configured.
 * `prepare: false` is required for Supabase's transaction pooler (port 6543).
 */
const callable = (() => undefined) as unknown as PostgresClient;
export const sql: PostgresClient = new Proxy(callable, {
  apply(_target, thisArg, args: Parameters<PostgresClient>) {
    return Reflect.apply(getClient(), thisArg, args);
  },
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// Errors raised before a query reaches PostgreSQL. Retrying these cannot
// duplicate writes, so they are safe to attempt again.
const RETRYABLE_CONNECTION_CODES = new Set([
  "CONNECT_TIMEOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

/**
 * Verify the database is reachable, retrying transient connection failures.
 * Supabase's pooler sits behind a high-latency path on some networks, so a
 * single cold attempt is not a reliable signal.
 */
export async function pingDatabase(attempts = 3): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await sql`SELECT 1`;
      return;
    } catch (error) {
      lastError = error;
      const code = (error as { code?: string }).code ?? "";
      if (!RETRYABLE_CONNECTION_CODES.has(code) || attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  throw lastError;
}
