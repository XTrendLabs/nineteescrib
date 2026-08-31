import { api } from "@/shared/lib/api-client";

/**
 * How full a property is on each night of a window.
 *
 * Drives the create dialog's calendar shading, so someone can see where the
 * property is busy before picking dates rather than discovering it from an
 * empty room list afterwards.
 */
export function useOccupancy(input: {
  propertyId: string | undefined;
  from: string;
  to: string;
}) {
  return api.api.platform.bookings.occupancy.$get.useQuery({
    query: {
      propertyId: input.propertyId ?? "",
      from: input.from,
      to: input.to,
    },
    enabled: Boolean(input.propertyId && input.from && input.to),
  });
}
