import { api } from "@/shared/lib/api-client";

/**
 * Adds a guest to the directory ahead of any booking.
 *
 * The server refuses a phone already on file rather than merging into it --
 * within an HQ the phone is the guest's identity.
 */
export function useCreateGuest() {
  return api.api.platform.bookings.guests.$post.useMutation();
}
