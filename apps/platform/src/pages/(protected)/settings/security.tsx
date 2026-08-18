import { createFileRoute } from "@tanstack/react-router";

import { SecuritySection } from "@/features/settings/components/security-section";

export const Route = createFileRoute("/(protected)/settings/security")({
  component: SecuritySection,
});
