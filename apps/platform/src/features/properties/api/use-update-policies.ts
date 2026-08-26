import { api } from "@/shared/lib/api-client";

export function useUpdatePolicies() {
  return api.api.platform.properties[":id"].policies.$patch.useMutation();
}
