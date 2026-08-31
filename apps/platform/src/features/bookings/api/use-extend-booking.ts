import { api } from "@/shared/lib/api-client";

/**
 * The rooms free for the nights a stay would extend into.
 *
 * Only the extra nights are checked: the guest already holds their room for
 * the nights they have booked.
 */
export function useExtensionOptions(
  bookingId: string | undefined,
  checkOut: string,
) {
  return api.api.platform.bookings[":id"]["extension-options"].$get.useQuery({
    param: { id: bookingId ?? "" },
    query: { checkOut },
    enabled: Boolean(bookingId && checkOut),
  });
}

export function useExtendBooking() {
  return api.api.platform.bookings[":id"].extend.$post.useMutation();
}
