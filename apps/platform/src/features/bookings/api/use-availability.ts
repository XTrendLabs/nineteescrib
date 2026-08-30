import { api } from "@/shared/lib/api-client";

/**
 * The rooms free for a stay, so the create form can only offer real choices.
 *
 * Disabled until a property and both dates are chosen -- there is no meaningful
 * availability to ask for before then.
 */
export function useAvailability(input: {
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

  return api.api.platform.bookings.availability.$get.useQuery({
    query: {
      propertyId: input.propertyId ?? "",
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      excludeBookingId: input.excludeBookingId ?? "",
    },
    enabled: ready,
  });
}
