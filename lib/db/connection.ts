import postgres from "postgres";

type PostgresClient = ReturnType<typeof postgres>;
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
    idle_timeout: 20,
    connect_timeout: 10,
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
  });
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
