import { createFileRoute } from "@tanstack/react-router";

import { PlanUsageSection } from "@/features/settings/components/plan-usage-section";

export const Route = createFileRoute("/(protected)/settings/plan")({
  component: PlanUsageSection,
});
