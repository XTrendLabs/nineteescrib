import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

console.log("--- DEBUG DEPLOYMENT ---");
console.log(
  "BETTER_AUTH_URL raw value:",
  JSON.stringify(process.env.BETTER_AUTH_URL),
);
console.log("------------------------");

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
