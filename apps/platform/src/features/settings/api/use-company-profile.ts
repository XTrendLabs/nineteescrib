import { api } from "@/shared/lib/api-client";

/**
 * The active workspace's company profile.
 *
 * `activeOrganizationId` travels as a query parameter to make the cache entry
 * per-workspace: the server resolves scope from the session, so without it
 * switching properties would redisplay the previous workspace's profile from
 * cache. The query input is the cache key here, which is why this is a
 * parameter rather than a key override.
 */
export function useCompanyProfile(activeOrganizationId: string | undefined) {
  return api.api.platform.settings["company-profile"].$get.useQuery({
    query: { activeOrganizationId: activeOrganizationId ?? "" },
    enabled: Boolean(activeOrganizationId),
  });
}
