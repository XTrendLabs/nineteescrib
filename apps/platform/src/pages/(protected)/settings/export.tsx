import { createFileRoute } from "@tanstack/react-router";

import { DataExportSection } from "@/features/settings/components/data-export-section";

export const Route = createFileRoute("/(protected)/settings/export")({
  component: DataExportSection,
});
