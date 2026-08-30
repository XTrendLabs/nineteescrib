import { api } from "@/shared/lib/api-client";

export function useDeleteVendor() {
  return api.api.platform.vendors[":id"].$delete.useMutation();
}
