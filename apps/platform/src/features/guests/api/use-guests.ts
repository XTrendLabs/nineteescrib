import { api } from "@/shared/lib/api-client";

/**
 * The guest directory for the caller's HQ.
 *
 * Stay counts, lifetime spend and last-stay date are aggregated by the server
 * over the bookings behind each guest, so they never disagree with the
 * bookings page. `activeOrganizationId` keys the cache per workspace.
 */
export function useGuests(activeOrganizationId: string | undefined) {
  return api.api.platform.bookings.guests.$get.useQuery({
    query: { activeOrganizationId: activeOrganizationId ?? "" },
    enabled: Boolean(activeOrganizationId),
  });
}

export function invalidateGuests(activeOrganizationId: string | undefined) {
  return api.api.platform.bookings.guests.$get.invalidate({
    query: { activeOrganizationId: activeOrganizationId ?? "" },
  });
}
