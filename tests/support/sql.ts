import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const schemaSql = readFileSync(
  fileURLToPath(new URL("../../lib/db/schema.sql", import.meta.url)),
  "utf8"
);
export const resetSql = readFileSync(
  fileURLToPath(new URL("../../lib/db/reset.sql", import.meta.url)),
  "utf8"
);
export const seedSql = readFileSync(
  fileURLToPath(new URL("../../seed.sql", import.meta.url)),
  "utf8"
);
