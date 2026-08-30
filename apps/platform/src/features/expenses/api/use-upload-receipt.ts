import { api } from "@/shared/lib/api-client";

export function useUploadReceipt() {
  return api.api.platform.expenses[":id"].receipts.$post.useMutation();
}
