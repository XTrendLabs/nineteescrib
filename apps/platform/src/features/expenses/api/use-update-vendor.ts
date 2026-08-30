import { api } from "@/shared/lib/api-client";

export function useUpdateVendor() {
  return api.api.platform.vendors[":id"].$patch.useMutation();
}
