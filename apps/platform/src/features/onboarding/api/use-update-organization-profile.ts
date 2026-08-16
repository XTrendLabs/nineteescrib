import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/features/auth/lib/auth-client";
import { honoClient } from "@/shared/lib/api-client";
import { checkPhoneAvailable } from "./check-phone-available";

export function useUpdateOrganizationProfile() {
  return useMutation({
    mutationFn: async (input: {
      organizationId: string;
      name: string;
      title: string;
      phoneNumber: string;
    }) => {
      await checkPhoneAvailable(input.phoneNumber, input.organizationId);

      const { error } = await authClient.organization.update({
        organizationId: input.organizationId,
        data: { name: input.name },
      });

      if (error) {
        throw new Error(error.message ?? "Failed to update organization");
      }

      await honoClient.api.platform.onboarding["member-title"].$post({
        json: { organizationId: input.organizationId, title: input.title },
      });

      return { organizationId: input.organizationId };
    },
  });
}
