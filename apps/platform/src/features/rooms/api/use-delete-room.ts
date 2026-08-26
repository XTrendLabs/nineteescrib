import { api } from "@/shared/lib/api-client";

export function useDeleteRoom() {
  return api.api.platform.rooms[":id"].$delete.useMutation();
}
