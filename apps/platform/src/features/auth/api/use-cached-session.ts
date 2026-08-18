import { useQuery } from "@tanstack/react-query";

import { authClient } from "../lib/auth-client";
import { authQueryKeys } from "./query-keys";

export const SESSION_STALE_TIME = 15 * 60 * 1000;

export function fetchSession() {
  return authClient.getSession().then((res) => res.data);
}

/**
 * Centralized, cached replacement for `authClient.useSession()`.
 *
 * better-auth's own hooks re-fetch on every new subscriber mount (no
 * staleTime concept), so navigating between pages re-triggers get-session
 * repeatedly. This wraps the same call in TanStack Query with a 15-minute
 * staleTime so all consumers share one cached result. The protected route's
 * `beforeLoad` (_layout.tsx) primes this exact cache entry once per
 * navigation via `queryClient.ensureQueryData`, so pages here just read it.
 */
export function useCachedSession() {
  return useQuery({
    queryKey: authQueryKeys.session(),
    queryFn: fetchSession,
    staleTime: SESSION_STALE_TIME,
    gcTime: SESSION_STALE_TIME,
  });
}
