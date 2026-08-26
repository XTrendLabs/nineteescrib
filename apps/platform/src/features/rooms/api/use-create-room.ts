import { api } from "@/shared/lib/api-client";

export function useCreateRoom() {
  return api.api.platform.rooms.$post.useMutation();
}
