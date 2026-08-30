import { api } from "@/shared/lib/api-client";

export function useCreateBooking() {
  return api.api.platform.bookings.$post.useMutation();
}
