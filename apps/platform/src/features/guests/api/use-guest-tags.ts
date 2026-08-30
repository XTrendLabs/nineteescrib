import { api } from "@/shared/lib/api-client";

/** Adds a tag a member applies by hand. "repeat" is derived, never sent. */
export function useAddGuestTag() {
  return api.api.platform.bookings.guests[":id"].tags.$post.useMutation();
}

export function useRemoveGuestTag() {
  return api.api.platform.bookings.guests[":id"].tags[
    ":tag"
  ].$delete.useMutation();
}
