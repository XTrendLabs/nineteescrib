import { api } from "@/shared/lib/api-client";
import { queryClient } from "@/shared/lib/query-client";

/**
 * The bookings the caller can see.
 *
 * At HQ scope that is every property in the portfolio; at property scope the
 * server narrows to that property whatever is asked for. `activeOrganizationId`
 * keys the cache per workspace and lets the server reject a read that arrived
 * across a workspace switch -- see `useExpenses`.
 */
export function useBookings(activeOrganizationId: string | undefined) {
  return api.api.platform.bookings.$get.useQuery({
    query: { activeOrganizationId: activeOrganizationId ?? "" },
    enabled: Boolean(activeOrganizationId),
  });
}

/** Refetches the bookings list and related queries across the application. */
export function invalidateBookings(activeOrganizationId: string | undefined) {
  queryClient.invalidateQueries();
  return api.api.platform.bookings.$get.invalidate({
    query: { activeOrganizationId: activeOrganizationId ?? "" },
  });
}
