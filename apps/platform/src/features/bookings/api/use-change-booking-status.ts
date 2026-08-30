import { api } from "@/shared/lib/api-client";

/** Moves a booking along its lifecycle: confirm, check in, check out. */
export function useChangeBookingStatus() {
  return api.api.platform.bookings[":id"].status.$post.useMutation();
}
