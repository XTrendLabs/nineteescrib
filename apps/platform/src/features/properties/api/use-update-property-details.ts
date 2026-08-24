import { api } from "@/shared/lib/api-client";

export function useUpdatePropertyDetails() {
  return api.api.platform.properties[":id"][
    "property-details"
  ].$patch.useMutation();
}
