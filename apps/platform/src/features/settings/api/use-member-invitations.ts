import { api } from "@/shared/lib/api-client";

export function useMemberInvitations(activeOrganizationId: string | undefined) {
  return api.api.platform.settings.members.invitations.$get.useQuery({
    query: { activeOrganizationId: activeOrganizationId ?? "" },
    enabled: Boolean(activeOrganizationId),
  });
}
