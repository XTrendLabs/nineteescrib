import { api } from "@/shared/lib/api-client";

export function useStaff(hqOrganizationId: string | undefined) {
  return api.api.platform.staff.$get.useQuery({
    query: { hqOrganizationId: hqOrganizationId ?? "" },
    enabled: Boolean(hqOrganizationId),
  });
}
