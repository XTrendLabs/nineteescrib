import { Hono } from "hono";

import type { AppEnv } from "./types";

export function createRouter() {
  return new Hono<AppEnv>();
}
