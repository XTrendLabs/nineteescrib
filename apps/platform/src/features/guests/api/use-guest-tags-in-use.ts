import { api } from "@/shared/lib/api-client";

/**
 * The tags actually in use across the HQ, most-used first.
 *
 * Drives the filter dropdown and the editor's suggestions, so both reflect the
 * vocabulary operators really use rather than a hard-coded list.
 */
export function useGuestTagsInUse(activeOrganizationId: string | undefined) {
  return api.api.platform.bookings.guests.tags.$get.useQuery({
    query: { activeOrganizationId: activeOrganizationId ?? "" },
    enabled: Boolean(activeOrganizationId),
  });
}

export function invalidateGuestTagsInUse(
  activeOrganizationId: string | undefined,
) {
  return api.api.platform.bookings.guests.tags.$get.invalidate({
    query: { activeOrganizationId: activeOrganizationId ?? "" },
  });
}
