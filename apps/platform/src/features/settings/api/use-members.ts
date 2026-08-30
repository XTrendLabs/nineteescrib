import { api } from "@/shared/lib/api-client";

/**
 * Everyone with platform access to the workspace -- the HQ and every property
 * beneath it, one row per person.
 *
 * `activeOrganizationId` travels as a query parameter to make the cache entry
 * per-workspace, the same reason it does on the other settings queries.
 */
export function useMembers(activeOrganizationId: string | undefined) {
  return api.api.platform.settings.members.$get.useQuery({
    query: { activeOrganizationId: activeOrganizationId ?? "" },
    enabled: Boolean(activeOrganizationId),
  });
}
