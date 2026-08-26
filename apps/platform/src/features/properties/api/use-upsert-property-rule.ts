import { api } from "@/shared/lib/api-client";

export function useUpsertPropertyRule() {
  return api.api.platform.properties[":id"].rules.$put.useMutation();
}
