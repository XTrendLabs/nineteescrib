import { createFileRoute } from "@tanstack/react-router";

import { MembersSection } from "@/features/settings/components/members-section";

export const Route = createFileRoute("/(protected)/settings/members")({
  component: MembersSection,
});
