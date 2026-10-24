import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const mode = process.argv[2] ?? "apply";
if (mode !== "apply" && mode !== "reset") {
  console.error("Usage: node scripts/db.mjs [apply|reset]");
  process.exit(2);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || /your-password|project-ref|\[region\]/i.test(databaseUrl)) {
  console.error("Set a real DATABASE_URL in .env.local before using database scripts.");
  process.exit(2);
}

const rootFile = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const args = ["--no-psqlrc", "--set=ON_ERROR_STOP=1", "--single-transaction"];
if (mode === "apply") {
  args.push("--file", rootFile("lib/db/schema.sql"), "--file", rootFile("seed.sql"));
  console.log("Applying the PostgreSQL schema and seed to DATABASE_URL.");
} else {
  args.push("--file", rootFile("lib/db/reset.sql"));
  console.warn("Resetting the database configured by DATABASE_URL (development only).");
}
args.push(databaseUrl);

const result = spawnSync("psql", args, { stdio: "inherit", env: process.env });
if (result.error) {
  console.error(result.error.code === "ENOENT" ? "psql was not found on PATH." : "psql could not be started.");
  process.exit(1);
}
process.exitCode = result.status ?? 1;
