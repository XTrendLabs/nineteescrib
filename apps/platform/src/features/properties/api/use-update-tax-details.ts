import { api } from "@/shared/lib/api-client";

export function useUpdateTaxDetails() {
  return api.api.platform.properties[":id"]["tax-details"].$patch.useMutation();
}
