import { api } from "@/shared/lib/api-client";

export function useUpdateGuest() {
  return api.api.platform.bookings.guests[":id"].$patch.useMutation();
}
