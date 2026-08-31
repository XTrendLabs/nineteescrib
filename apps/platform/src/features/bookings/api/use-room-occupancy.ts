import { api } from "@/shared/lib/api-client";

/**
 * The nights this booking's own room is taken.
 *
 * Property-wide occupancy is the wrong question when checking a guest in
 * early: what matters is whether *their* room is free on the day they arrived,
 * not whether the property has space somewhere else.
 */
export function useRoomOccupancy(
  bookingId: string | undefined,
  window: { from: string; to: string },
) {
  return api.api.platform.bookings[":id"]["room-occupancy"].$get.useQuery({
    param: { id: bookingId ?? "" },
    query: window,
    enabled: Boolean(bookingId && window.from && window.to),
  });
}
