import { api } from "@/shared/lib/api-client";

/**
 * A booking's timeline, for the audit drawer.
 *
 * Fetched per booking rather than joined onto the list: the trail is only ever
 * read for the one booking whose drawer is open, and attaching every event to
 * every row would grow the list response without bound.
 */
export function useBookingAudit(bookingId: string | undefined) {
  return api.api.platform.bookings[":id"].audit.$get.useQuery({
    param: { id: bookingId ?? "" },
    enabled: Boolean(bookingId),
  });
}
