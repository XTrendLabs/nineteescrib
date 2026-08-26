import { api } from "@/shared/lib/api-client";

export function useDeleteRoomImage() {
  return api.api.platform.rooms[":id"].images[":imageId"].$delete.useMutation();
}
