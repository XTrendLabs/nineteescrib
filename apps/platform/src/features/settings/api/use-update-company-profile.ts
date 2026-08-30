import { api } from "@/shared/lib/api-client";

export function useUpdateCompanyProfile() {
  return api.api.platform.settings["company-profile"].$patch.useMutation();
}
