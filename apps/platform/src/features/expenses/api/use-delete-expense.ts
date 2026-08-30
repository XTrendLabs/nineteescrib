import { api } from "@/shared/lib/api-client";

export function useDeleteExpense() {
  return api.api.platform.expenses[":id"].$delete.useMutation();
}
