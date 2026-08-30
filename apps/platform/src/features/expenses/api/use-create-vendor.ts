import { api } from "@/shared/lib/api-client";

export function useCreateVendor() {
  return api.api.platform.vendors.$post.useMutation();
}
