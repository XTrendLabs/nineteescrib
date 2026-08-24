import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../../../core";

export const requirePermission = createMiddleware<AppEnv>(async (c, next) => {
  console.log("[requirePermission] called", {
    path: c.req.path,
    userId: c.get("session")?.user.id,
  });

  // TODO: check the caller's role/permissions for this organization (e.g.
  // staff role vs owner) and throw AppError.forbidden() when not allowed.

  await next();
});
