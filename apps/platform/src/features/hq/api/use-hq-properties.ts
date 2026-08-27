import { api } from "@/shared/lib/api-client";

/** Every property under an HQ -- the "view all properties" surface. */
export function useHqProperties(hqOrganizationId: string | undefined) {
  return api.api.platform.hq[":id"].properties.$get.useQuery({
    param: { id: hqOrganizationId ?? "" },
    enabled: Boolean(hqOrganizationId),
  });
}
