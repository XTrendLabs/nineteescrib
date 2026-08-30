import { api } from "@/shared/lib/api-client";

/** Adds one installment to an expense's ledger. */
export function useRecordPayment() {
  return api.api.platform.expenses[":id"].payments.$post.useMutation();
}
