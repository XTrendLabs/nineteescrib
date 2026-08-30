import { api } from "@/shared/lib/api-client";

export function useDeleteReceipt() {
  return api.api.platform.expenses[":id"].receipts[
    ":receiptId"
  ].$delete.useMutation();
}
