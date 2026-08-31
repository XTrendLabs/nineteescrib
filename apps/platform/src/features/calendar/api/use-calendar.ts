import { api } from "@/shared/lib/api-client";

/**
 * The rooms the calendar draws rows for.
 *
 * Fetched separately from the bookings because an empty room still needs a
 * row -- deriving inventory from the bookings alone would hide every room
 * nobody has booked yet.
 */
export function useInventory(
  activeOrganizationId: string | undefined,
  propertyId: string,
) {
  return api.api.platform.bookings.inventory.$get.useQuery({
    query: {
      activeOrganizationId: activeOrganizationId ?? "",
      propertyId,
    },
    enabled: Boolean(activeOrganizationId),
  });
}

/** The bookings overlapping the visible window. */
export function useCalendarBookings(
  activeOrganizationId: string | undefined,
  window: { from: string; to: string },
  propertyId: string,
) {
  return api.api.platform.bookings.calendar.$get.useQuery({
    query: {
      activeOrganizationId: activeOrganizationId ?? "",
      from: window.from,
      to: window.to,
      propertyId,
    },
    enabled: Boolean(activeOrganizationId && window.from && window.to),
  });
}

export function invalidateCalendar() {
  return api.api.platform.bookings.calendar.$get.invalidate();
}

/**
 * The earliest upcoming stay, so the calendar can open where the bookings are.
 *
 * Landing on today's month is right for a busy property and unhelpful for a
 * quiet one -- an empty grid reads as a broken page rather than a free month.
 */
export function useNextBookingDate(
  activeOrganizationId: string | undefined,
  propertyId: string,
) {
  return api.api.platform.bookings["next-date"].$get.useQuery({
    query: {
      activeOrganizationId: activeOrganizationId ?? "",
      propertyId,
    },
    enabled: Boolean(activeOrganizationId),
  });
}
