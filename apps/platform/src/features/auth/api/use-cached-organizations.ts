import { useQuery } from "@tanstack/react-query";

import { authClient } from "../lib/auth-client";
import { authQueryKeys } from "./query-keys";
import { SESSION_STALE_TIME, useCachedSession } from "./use-cached-session";

export function fetchOrganizationList() {
  return authClient.organization.list().then((res) => res.data);
}

export function fetchActiveOrganization() {
  return authClient.organization.getFullOrganization().then((res) => res.data);
}

export function getActiveOrganizationId(
  session: Awaited<ReturnType<typeof authClient.getSession>>["data"],
) {
  return (session?.session as { activeOrganizationId?: string } | undefined)
    ?.activeOrganizationId;
}

/**
 * Centralized, cached replacement for `authClient.useListOrganizations()`.
 * See use-cached-session.ts for why this wrapping exists.
 */
export function useCachedOrganizationList() {
  const { data: session } = useCachedSession();

  return useQuery({
    queryKey: authQueryKeys.organizations(session?.user.id),
    queryFn: fetchOrganizationList,
    enabled: Boolean(session),
    staleTime: SESSION_STALE_TIME,
    gcTime: SESSION_STALE_TIME,
  });
}

/**
 * Centralized, cached replacement for `authClient.useActiveOrganization()`.
 * Server resolves the active org from the session, so this is keyed by
 * session id + the session's activeOrganizationId so switching orgs still
 * invalidates correctly. Primed once per navigation by _layout.tsx.
 */
export function useCachedActiveOrganization() {
  const { data: session } = useCachedSession();
  const activeOrganizationId = getActiveOrganizationId(session);

  return useQuery({
    queryKey: authQueryKeys.activeOrganization(
      session?.user.id,
      activeOrganizationId,
    ),
    queryFn: fetchActiveOrganization,
    enabled: Boolean(session),
    staleTime: SESSION_STALE_TIME,
    gcTime: SESSION_STALE_TIME,
  });
}
