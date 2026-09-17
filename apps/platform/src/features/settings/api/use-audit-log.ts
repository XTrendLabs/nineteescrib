import { api } from "@/shared/lib/api-client";

/**
 * A page of the workspace's activity trail.
 *
 * `before` is the keyset cursor from the previous page; omitting it reads the
 * newest ten. Both it and `activeOrganizationId` are part of the query, so
 * each page and each workspace get their own cache entry.
 */
export function useAuditLog(
  activeOrganizationId: string | undefined,
  before?: string,
) {
  return api.api.platform.settings.audit.$get.useQuery({
    query: {
      activeOrganizationId: activeOrganizationId ?? "",
      before: before ?? "",
    },
    enabled: Boolean(activeOrganizationId),
  });
}
