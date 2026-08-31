import { api } from "@/shared/lib/api-client";

/**
 * Edits a booking's room, dates or details.
 *
 * The server re-checks availability whenever the room or dates move, so a drag
 * onto an occupied room is refused rather than silently double-booking.
 */
export function useUpdateBooking() {
  return api.api.platform.bookings[":id"].$patch.useMutation();
}
