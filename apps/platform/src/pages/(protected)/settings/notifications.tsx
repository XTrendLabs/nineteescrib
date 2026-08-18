import { createFileRoute } from "@tanstack/react-router";

import { NotificationsSection } from "@/features/settings/components/notifications-section";

export const Route = createFileRoute("/(protected)/settings/notifications")({
  component: NotificationsSection,
});
