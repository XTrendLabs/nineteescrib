import { api } from "@/shared/lib/api-client";

/**
 * The expenses the caller can see.
 *
 * At HQ scope that is the whole business's book; at property scope the server
 * answers with that property's spend plus the HQ-shared costs it carries a
 * share of. `activeOrganizationId` keys the cache per workspace -- see
 * `useVendors`.
 */
export function useExpenses(activeOrganizationId: string | undefined) {
  return api.api.platform.expenses.$get.useQuery({
    query: { activeOrganizationId: activeOrganizationId ?? "" },
    enabled: Boolean(activeOrganizationId),
  });
}
