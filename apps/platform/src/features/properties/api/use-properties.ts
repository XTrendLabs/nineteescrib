import { api } from "@/shared/lib/api-client";

export function useProperties(organizationId: string | undefined) {
  return api.api.platform.properties.$get.useQuery({
    query: { organizationId: organizationId ?? "" },
    enabled: Boolean(organizationId),
  });
}
