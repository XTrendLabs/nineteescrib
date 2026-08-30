import { api } from "@/shared/lib/api-client";

export function useUpdateExpense() {
  return api.api.platform.expenses[":id"].$patch.useMutation();
}
