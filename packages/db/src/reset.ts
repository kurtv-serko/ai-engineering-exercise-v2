/**
 * Drop, recreate and seed the dev database.
 *
 * Run via `pnpm db:reset`. Destructive: every booking you made is dropped.
 * The API seeds a fresh database on boot by itself, so you only need this to
 * get back to a known state.
 */

import { applySchema, createDb, DEFAULT_DB_PATH } from "./client.js";
import { seed } from "./seed.js";

const db = createDb();
applySchema(db);
seed(db);

console.log(`farepath: database ready at ${DEFAULT_DB_PATH}`);
