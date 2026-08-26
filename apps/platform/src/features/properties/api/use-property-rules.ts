import { api } from "@/shared/lib/api-client";

export function usePropertyRules(propertyId: string | undefined) {
  return api.api.platform.properties[":id"].rules.$get.useQuery({
    param: { id: propertyId ?? "" },
    enabled: Boolean(propertyId),
  });
}
