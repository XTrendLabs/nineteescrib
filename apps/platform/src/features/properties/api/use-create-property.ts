import { api } from "@/shared/lib/api-client";

export function useCreateProperty() {
  return api.api.platform.properties.$post.useMutation();
}
