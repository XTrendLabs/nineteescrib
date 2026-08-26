import { api } from "@/shared/lib/api-client";

export function useDeleteStaff() {
  return api.api.platform.staff[":id"].$delete.useMutation();
}
