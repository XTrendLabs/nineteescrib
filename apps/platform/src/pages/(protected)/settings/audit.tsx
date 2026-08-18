import { createFileRoute } from "@tanstack/react-router";

import { AuditLogSection } from "@/features/settings/components/audit-log-section";

export const Route = createFileRoute("/(protected)/settings/audit")({
  component: AuditLogSection,
});
