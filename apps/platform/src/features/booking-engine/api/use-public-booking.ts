import { api } from "@/shared/lib/api-client";

/** The property behind a public booking link, by its slug. */
export function usePublicProperty(slug: string) {
  return api.api.public.properties[":slug"].$get.useQuery({
    param: { slug },
  });
}

/**
 * The rooms free for these dates, priced for the stay.
 *
 * Disabled until both dates are set and in order -- the endpoint refuses a
 * zero-length stay, and asking before the guest has picked is a wasted call.
 */
export function usePublicAvailability(input: {
  slug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  return api.api.public.properties[":slug"].availability.$get.useQuery({
    param: { slug: input.slug },
    query: {
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: String(input.guests),
    },
    enabled: Boolean(
      input.slug &&
        input.checkIn &&
        input.checkOut &&
        input.checkOut > input.checkIn,
    ),
  });
}

/**
 * How full the property is each night of a window.
 *
 * Feeds the calendar's shading, so a visitor sees where the property is busy
 * before picking dates rather than after.
 */
export function usePublicOccupancy(input: {
  slug: string;
  from: string;
  to: string;
}) {
  return api.api.public.properties[":slug"].occupancy.$get.useQuery({
    param: { slug: input.slug },
    query: { from: input.from, to: input.to },
    enabled: Boolean(input.slug && input.from && input.to),
  });
}

/** Books a room. The server prices it; the client cannot set the total. */
export function useCreatePublicBooking() {
  return api.api.public.properties[":slug"].bookings.$post.useMutation();
}
