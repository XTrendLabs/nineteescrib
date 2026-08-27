import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

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

type OrganizationKind = "hq" | "property";

function organizationKind(org: { kind?: string | null }): OrganizationKind {
  return org.kind === "hq" ? "hq" : "property";
}

/**
 * The user's HQ organizations. `organization.list()` returns every membership,
 * which under this model mixes HQs and individual properties together.
 */
export function useCachedHqList() {
  const query = useCachedOrganizationList();
  return {
    ...query,
    data: query.data?.filter((org) => organizationKind(org) === "hq"),
  };
}

/** The property organizations the user is a direct member of. */
export function useCachedPropertyOrganizationList() {
  const query = useCachedOrganizationList();
  return {
    ...query,
    data: query.data?.filter((org) => organizationKind(org) === "property"),
  };
}

/**
 * The HQ the user is currently working under, derived from the active
 * organization rather than stored separately -- so it can never disagree with
 * what the server authorizes against.
 *
 * When a property is active this is its parent HQ; when an HQ is active it is
 * that HQ. Undefined for a standalone property with no HQ above it.
 */
export function useActiveHq() {
  const { data: activeOrganization } = useCachedActiveOrganization();
  const { data: organizations, ...query } = useCachedOrganizationList();

  const hqs = organizations?.filter((org) => organizationKind(org) === "hq");

  const activeHqId =
    activeOrganization == null
      ? undefined
      : organizationKind(activeOrganization) === "hq"
        ? activeOrganization.id
        : ((activeOrganization as { parentOrganizationId?: string | null })
            .parentOrganizationId ?? undefined);

  const isHqActive =
    activeOrganization != null && organizationKind(activeOrganization) === "hq";

  return {
    ...query,
    /** Every HQ the user belongs to, for the scope picker. */
    hqs,
    activeHqId,
    activeHq: hqs?.find((hq) => hq.id === activeHqId),
    /**
     * The active organization itself -- HQ or property. Use this to key
     * scope-dependent queries, since `activeHqId` is undefined for a
     * standalone property with no HQ above it.
     */
    activeScopeId: activeOrganization?.id,
    /** True when the active organization is an HQ rather than a property. */
    isHqActive,
    /**
     * The active property's slug when scoped to a single property, for routing
     * users straight into it. Undefined at HQ scope.
     */
    activePropertySlug:
      !isHqActive && activeOrganization?.slug
        ? activeOrganization.slug
        : undefined,
  };
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
  const organizationList = useCachedOrganizationList();
  const queryClient = useQueryClient();

  // Prefer an HQ so a returning user lands on the all-properties overview
  // rather than an arbitrary single property.
  const fallbackOrganizationId = !activeOrganizationId
    ? (organizationList.data?.find((org) => organizationKind(org) === "hq")
        ?.id ?? organizationList.data?.[0]?.id)
    : undefined;

  useEffect(() => {
    if (!fallbackOrganizationId) return;
    authClient.organization
      .setActive({ organizationId: fallbackOrganizationId })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: authQueryKeys.session() });
      });
  }, [fallbackOrganizationId, queryClient]);

  return useQuery({
    queryKey: authQueryKeys.activeOrganization(
      session?.user.id,
      activeOrganizationId,
    ),
    queryFn: fetchActiveOrganization,
    enabled: Boolean(session) && Boolean(activeOrganizationId),
    staleTime: SESSION_STALE_TIME,
    gcTime: SESSION_STALE_TIME,
  });
}
