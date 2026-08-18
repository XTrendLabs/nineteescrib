/**
 * Shared query-key builders so route-level prefetching (in _layout.tsx's
 * beforeLoad) and the useCachedSession/useCachedActiveOrganization hooks
 * always target the exact same cache entries.
 */
export const authQueryKeys = {
  session: () => ["auth", "session"] as const,
  organizations: (userId: string | undefined) =>
    ["auth", "organizations", userId] as const,
  activeOrganization: (
    userId: string | undefined,
    activeOrganizationId: string | undefined,
  ) => ["auth", "active-organization", userId, activeOrganizationId] as const,
};
