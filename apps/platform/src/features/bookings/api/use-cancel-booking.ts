import { api } from "@/shared/lib/api-client";

/**
 * Cancels a booking, freeing the room.
 *
 * The row is kept rather than deleted, so the stay still appears in the guest's
 * history and in the cancellation rate.
 */
export function useCancelBooking() {
  return api.api.platform.bookings[":id"].cancel.$post.useMutation();
}
