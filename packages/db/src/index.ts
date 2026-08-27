import { env } from "@propertyos/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/**
 * One pool for the whole process. Each `drizzle(connectionString)` call builds
 * its own pool, and opening a connection to the (remote) database costs ~800ms,
 * so every module-level `createDb()` used to pay that separately.
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  // Keep connections hot: reconnecting dominates query time at this distance.
  idleTimeoutMillis: 60_000,
  keepAlive: true,
});

export const db = drizzle(pool, { schema });

/** @deprecated Import `db` instead -- this returns the shared instance. */
export function createDb() {
  return db;
}

export type Db = typeof db;
