import { api } from "@/shared/lib/api-client";

/**
 * One guest's full profile: stats, stay history and notes.
 *
 * Fetched only for the open drawer -- attaching every stay and note to every
 * row of the directory would grow the list response without bound.
 */
export function useGuest(guestId: string | undefined) {
  return api.api.platform.bookings.guests[":id"].$get.useQuery({
    param: { id: guestId ?? "" },
    enabled: Boolean(guestId),
  });
}

/** Refetches one guest's profile after a tag or note changes. */
export function invalidateGuest(guestId: string | undefined) {
  if (!guestId) return;
  return api.api.platform.bookings.guests[":id"].$get.invalidate({
    param: { id: guestId },
  });
}
