import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.string().url(),
    /**
     * Whether the public booking engine is switched on.
     *
     * Off by default, and deliberately so: the booking pages and the
     * booking-link setup still run on mock data, so shipping them enabled
     * would show guests prices and availability that nothing stands behind.
     * The flag is what lets that code sit on main while it is finished.
     */
    VITE_ENABLE_BOOKING_ENGINE: z.stringbool().optional().default(false),
  },
  runtimeEnv: {
    VITE_SERVER_URL:
      import.meta.env.VITE_SERVER_URL ||
      (typeof process !== "undefined"
        ? process.env.VITE_SERVER_URL
        : undefined),
    VITE_ENABLE_BOOKING_ENGINE:
      import.meta.env.VITE_ENABLE_BOOKING_ENGINE ||
      (typeof process !== "undefined"
        ? process.env.VITE_ENABLE_BOOKING_ENGINE
        : undefined),
  },
  skipValidation: !!(typeof process !== "undefined"
    ? process.env.SKIP_ENV_VALIDATION
    : undefined),
  emptyStringAsUndefined: true,
});
