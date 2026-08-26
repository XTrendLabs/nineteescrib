import { api } from "@/shared/lib/api-client";

export function useCreateStaff() {
  return api.api.platform.staff.$post.useMutation();
}
