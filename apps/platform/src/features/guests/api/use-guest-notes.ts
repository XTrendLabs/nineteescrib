import { api } from "@/shared/lib/api-client";

export function useAddGuestNote() {
  return api.api.platform.bookings.guests[":id"].notes.$post.useMutation();
}

export function useRemoveGuestNote() {
  return api.api.platform.bookings.guests.notes[
    ":noteId"
  ].$delete.useMutation();
}
