import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { AppError } from "./error";
import { fail } from "./response";
import type { AppEnv } from "./types";

export function createApp() {
  const app = new Hono<AppEnv>();

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json(fail(err.code, err.message, err.details), err.status);
    }

    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    console.error(err);
    return c.json(fail("INTERNAL_ERROR", "Something went wrong"), 500);
  });

  return app;
}
