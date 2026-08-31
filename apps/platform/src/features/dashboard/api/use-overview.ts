import { api } from "@/shared/lib/api-client";

/**
 * The overview for the active workspace and date window.
 *
 * Shape follows the scope the server resolves from the session: an HQ gets a
 * portfolio, a property gets its own operation. `activeOrganizationId` keys the
 * cache per workspace and lets the server reject a response that arrived across
 * a workspace switch -- see `useExpenses`.
 */
export function useOverview(input: {
  activeOrganizationId: string | undefined;
  propertyId: string;
  from: string;
  to: string;
}) {
  return api.api.platform.dashboard.overview.$get.useQuery({
    query: {
      activeOrganizationId: input.activeOrganizationId ?? "",
      propertyId: input.propertyId,
      from: input.from,
      to: input.to,
    },
    enabled: Boolean(input.activeOrganizationId && input.from && input.to),
  });
}
