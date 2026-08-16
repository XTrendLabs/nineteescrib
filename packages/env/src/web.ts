import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.string().url(),
  },
  runtimeEnv: {
    VITE_SERVER_URL:
      import.meta.env.VITE_SERVER_URL ||
      (typeof process !== "undefined"
        ? process.env.VITE_SERVER_URL
        : undefined),
  },
  skipValidation: !!(typeof process !== "undefined"
    ? process.env.SKIP_ENV_VALIDATION
    : undefined),
  emptyStringAsUndefined: true,
});
