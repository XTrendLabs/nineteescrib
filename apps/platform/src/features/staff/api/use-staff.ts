import { api } from "@/shared/lib/api-client";

/**
 * The staff the caller can see.
 *
 * At HQ scope that is the whole organization; at property scope the server
 * answers with that property's roster and ignores `hqOrganizationId` -- a
 * staff member has no HQ membership to name, so gating the request on one
 * would leave them looking at an empty directory.
 *
 * `activeOrganizationId` is what makes the cache entry per-workspace. Every
 * property under one HQ resolves to the same `hqOrganizationId`, so without it
 * switching properties reused the previous property's roster. The query input
 * is the cache key here, which is why this travels as a parameter rather than
 * as a key override.
 */
export function useStaff(
  hqOrganizationId: string | undefined,
  activeOrganizationId: string | undefined,
) {
  return api.api.platform.staff.$get.useQuery({
    query: {
      hqOrganizationId: hqOrganizationId ?? "",
      activeOrganizationId: activeOrganizationId ?? "",
    },
    enabled: Boolean(activeOrganizationId),
  });
}
