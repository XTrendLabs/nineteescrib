import { api } from "@/shared/lib/api-client";

export function useRooms(propertyId: string | undefined) {
  return api.api.platform.rooms.$get.useQuery({
    query: { propertyId: propertyId ?? "" },
    enabled: Boolean(propertyId),
  });
}
