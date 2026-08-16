import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/features/auth/lib/auth-client";
import { honoClient } from "@/shared/lib/api-client";

function slugify(name: string) {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useCreateOrganization() {
  return useMutation({
    mutationFn: async (input: { name: string; title: string }) => {
      const { data, error } = await authClient.organization.create({
        name: input.name,
        slug: slugify(input.name),
      });

      if (error || !data) {
        throw new Error(error?.message ?? "Failed to create organization");
      }

      await authClient.organization.setActive({ organizationId: data.id });

      await honoClient.api.platform.onboarding["member-title"].$post({
        json: { organizationId: data.id, title: input.title },
      });

      return { organizationId: data.id as string };
    },
  });
}
