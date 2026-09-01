/**
 * First-run bootstrap.
 *
 * A clean clone has no database file. Rather than make `pnpm install` do it —
 * which races the native build of better-sqlite3 — the API calls this on boot.
 * It is a no-op once the database has rows, so restarts keep your data.
 *
 * `pnpm db:reset` is the explicit way to wipe and reseed.
 */

import { applySchema, type Db } from "./client.js";
import { seed } from "./seed.js";

function isSeeded(db: Db): boolean {
  try {
    const row = db.$client
      .prepare("SELECT COUNT(*) AS n FROM fares")
      .get() as { n: number } | undefined;
    return (row?.n ?? 0) > 0;
  } catch {
    // Table does not exist yet.
    return false;
  }
}

/** Create and seed the schema if this database has never been used. */
export function ensureSeeded(db: Db): { seeded: boolean } {
  if (isSeeded(db)) {
    return { seeded: false };
  }

  applySchema(db);
  seed(db);
  return { seeded: true };
}
