import { api } from "@/shared/lib/api-client";

export function useAmenities() {
  return api.api.platform.rooms.amenities.$get.useQuery();
}
