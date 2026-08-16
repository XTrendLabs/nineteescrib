import type { AppType } from "@apps/server";
import { env } from "@propertyos/env/web";
import { hc } from "hono/client";
import { HonoReactQuery } from "hono-tanstack-query";

import { queryClient } from "./query-client";

export const honoClient = hc<AppType>(env.VITE_SERVER_URL, {
  init: { credentials: "include" },
});

export const api = HonoReactQuery(honoClient, { queryClient });
