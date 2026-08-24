import { api } from "@/shared/lib/api-client";

export function useUpdateBusinessDetails() {
  return api.api.platform.properties[":id"].$patch.useMutation();
}
