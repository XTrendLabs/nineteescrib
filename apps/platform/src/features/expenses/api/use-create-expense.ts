import { api } from "@/shared/lib/api-client";

export function useCreateExpense() {
  return api.api.platform.expenses.$post.useMutation();
}
