import { createFileRoute } from "@tanstack/react-router";

import { CompanyProfileSection } from "@/features/settings/components/company-profile-section";

export const Route = createFileRoute("/(protected)/settings/company")({
  component: CompanyProfileSection,
});
