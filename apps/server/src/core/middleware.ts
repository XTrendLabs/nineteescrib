import { auth } from "@propertyos/auth";
import { createMiddleware } from "hono/factory";

import { AppError } from "./error";
import type { AppEnv } from "./types";

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    throw AppError.unauthorized();
  }
  c.set("session", session);
  await next();
});
