import { api } from "@/shared/lib/api-client";

/**
 * The vendor directory for the caller's HQ.
 *
 * The server derives the HQ from the active organization, so no id travels in
 * the query. `activeOrganizationId` is still sent to key the cache per
 * workspace: every property under one HQ resolves to the same directory, and
 * without it a stale response could be read as belonging to a workspace it did
 * not come from.
 */
export function useVendors(activeOrganizationId: string | undefined) {
  return api.api.platform.vendors.$get.useQuery({
    query: { activeOrganizationId: activeOrganizationId ?? "" },
    enabled: Boolean(activeOrganizationId),
  });
}
