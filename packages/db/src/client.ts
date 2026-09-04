import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema.js";

const here = dirname(fileURLToPath(import.meta.url));

/** Repository root, so every workspace resolves the same database file. */
export const DEFAULT_DB_PATH = resolve(here, "../../../farepath.sqlite");

export const SCHEMA_SQL_PATH = resolve(here, "./schema.sql");

export type Db = ReturnType<typeof createDb>;

export function createDb(path: string = DEFAULT_DB_PATH) {
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

/**
 * Drop and recreate every table. Used by `pnpm db:reset` and by the test
 * harness, which runs against an in-memory database.
 */
export function applySchema(db: Db): void {
  const sql = readFileSync(SCHEMA_SQL_PATH, "utf8");
  db.$client.exec(sql);
}
