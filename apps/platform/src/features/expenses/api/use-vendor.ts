import { api } from "@/shared/lib/api-client";

export function useVendor(id: string | undefined) {
  return api.api.platform.vendors[":id"].$get.useQuery({
    param: { id: id ?? "" },
    enabled: Boolean(id),
  });
}
