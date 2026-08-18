import { createFileRoute } from "@tanstack/react-router";

import { DangerZoneSection } from "@/features/settings/components/danger-zone-section";

export const Route = createFileRoute("/(protected)/settings/danger")({
  component: DangerZoneSection,
});
