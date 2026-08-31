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
  /**
   * Never retire an idle connection.
   *
   * Opening one costs 1.4-2.3s against a remote managed Postgres -- the TLS
   * handshake and authentication, not the query, which runs in ~100ms once the
   * connection exists. With a 60s idle timeout every quiet minute threw that
   * work away and made the next request pay for it again, which is what made
   * an idle-then-used form feel like it hung.
   *
   * A connection that dies anyway is replaced by the pool on demand, so the
   * only cost of keeping them is a handful of open sockets.
   */
  idleTimeoutMillis: 0,
  keepAlive: true,
  /**
   * Fail fast rather than hanging: without this a connection attempt to an
   * unreachable database waits on the OS timeout, and the request appears to
   * stall rather than error.
   */
  connectionTimeoutMillis: 10_000,
});

export const db = drizzle(pool, { schema });

/**
 * Open a few connections up front, then keep them alive.
 *
 * The pool is lazy, so without this the first concurrent requests each pay the
 * multi-second handshake. The periodic ping matters just as much: managed
 * providers and the network in between drop connections that sit silent, and a
 * dropped connection is only discovered when a real request tries to use it --
 * paying the reconnect exactly when a user is waiting. Pinging moves that cost
 * off the request path.
 */
export async function warmPool(connections = 4) {
  await Promise.all(
    Array.from({ length: connections }, () =>
      pool.query("select 1").catch(() => undefined),
    ),
  );

  // Unref'd so this timer never holds the process open on its own.
  const heartbeat = setInterval(() => {
    void pool.query("select 1").catch(() => undefined);
  }, 4 * 60_000);
  heartbeat.unref?.();
}

/** @deprecated Import `db` instead -- this returns the shared instance. */
export function createDb() {
  return db;
}

export type Db = typeof db;
