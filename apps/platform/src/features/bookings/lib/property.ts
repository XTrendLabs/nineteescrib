/**
 * A property as the bookings page needs it: an id to filter and scope by, and
 * a name to show. Narrower than the full property record on purpose, so the
 * filter toolbar and the create form do not depend on the properties feature.
 */
export type BookingProperty = {
  id: string;
  name: string;
};

/**
 * The properties a booking can be filed against.
 *
 * Returns an empty list rather than placeholder rows when none have loaded:
 * offering a property that does not exist would let someone build a booking
 * the server must then reject.
 */
export function resolveBookingProperties(
  properties: { id: string; name: string }[] | undefined,
): BookingProperty[] {
  if (!properties) return [];
  return properties.map((p) => ({ id: p.id, name: p.name }));
}
