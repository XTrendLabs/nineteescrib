import { api } from "@/shared/lib/api-client";

export function useDeletePropertyRule() {
  return api.api.platform.properties[":id"].rules[
    ":category"
  ].$delete.useMutation();
}
