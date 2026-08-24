import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../../../core";

export const requireSubscription = createMiddleware<AppEnv>(async (c, next) => {
  console.log("[requireSubscription] called", {
    path: c.req.path,
    organizationId: c.req.query("organizationId"),
  });

  // TODO: look up the organization's active subscription/plan and throw
  // AppError.forbidden() when the plan doesn't cover this route.

  await next();
});
