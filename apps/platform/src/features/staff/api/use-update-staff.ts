import { api } from "@/shared/lib/api-client";

export function useUpdateStaff() {
  return api.api.platform.staff[":id"].$patch.useMutation();
}
