import { api } from "@/shared/lib/api-client";

/**
 * Every room in a property, each carrying the stays that clash with the chosen
 * dates.
 *
 * Distinct from `useAvailability`, which returns only free rooms: the create
 * dialog shows the whole inventory so a booked room says why it is unavailable
 * rather than quietly disappearing from the list.
 */
export function useRoomAvailability(input: {
  propertyId: string | undefined;
  checkIn: string;
  checkOut: string;
  excludeBookingId?: string;
}) {
  const ready = Boolean(
    input.propertyId &&
      input.checkIn &&
      input.checkOut &&
      input.checkOut > input.checkIn,
  );

  return api.api.platform.bookings["room-availability"].$get.useQuery({
    query: {
      propertyId: input.propertyId ?? "",
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      excludeBookingId: input.excludeBookingId ?? "",
    },
    enabled: ready,
  });
}
