import { auth } from "@propertyos/auth";
import { env } from "@propertyos/env/server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createApp } from "./core";
import { adminRoutes } from "./modules/admin/admin.routes";
import { platformRoutes } from "./modules/platform/platform.routes";

const app = createApp();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET", "PUT", "PATCH", "DELETE"], "/api/auth/*", (c) =>
  auth.handler(c.req.raw),
);

const routes = app
  .route("/api/platform", platformRoutes)
  .route("/api/admin", adminRoutes);

app.get("/", (c) => {
  return c.text("OK");
});

export type AppType = typeof routes;

const port = process.env.PORT || 3000;

console.log(`Server is running on http://0.0.0.0:${port}`);

export default {
  port: Number(port),
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
