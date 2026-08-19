import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@propertyos/ui/components/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { ZapIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { CustomBuilderTab } from "@/features/reports/components/custom-builder-tab";
import { ProBadge } from "@/features/reports/components/pro-badge";
import { ReportPreviewSheet } from "@/features/reports/components/report-preview-sheet";
import {
  ScheduleDialog,
  type ScheduleSource,
} from "@/features/reports/components/schedule-dialog";
import { ScheduledEmailsTab } from "@/features/reports/components/scheduled-emails-tab";
import { StandardTemplatesTab } from "@/features/reports/components/standard-templates-tab";
import type { ReportTemplate } from "@/features/reports/lib/mock-data";

export const Route = createFileRoute("/(protected)/reports/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [runningTemplate, setRunningTemplate] = useState<ReportTemplate | null>(
    null,
  );
  const [scheduleSource, setScheduleSource] = useState<ScheduleSource | null>(
    null,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex flex-col gap-6 p-4"
    >
      <div>
        <h1 className="text-display-md">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Pre-built templates, a custom report builder, and automated email
          delivery
        </p>
      </div>

      <Tabs defaultValue="standard">
        <TabsList>
          <TabsTab value="standard">Standard Templates</TabsTab>
          <TabsTab value="builder" className="gap-1.5">
            Custom Builder
            <ZapIcon className="size-3" />
            <ProBadge className="ml-0.5" />
          </TabsTab>
          <TabsTab value="scheduled" className="gap-1.5">
            Scheduled Emails
            <ProBadge className="ml-0.5" />
          </TabsTab>
        </TabsList>

        <TabsPanel value="standard">
          <StandardTemplatesTab onRun={setRunningTemplate} />
        </TabsPanel>
        <TabsPanel value="builder">
          <CustomBuilderTab />
        </TabsPanel>
        <TabsPanel value="scheduled">
          <ScheduledEmailsTab />
        </TabsPanel>
      </Tabs>

      <ReportPreviewSheet
        template={runningTemplate}
        onOpenChange={(open) => !open && setRunningTemplate(null)}
        onScheduleEmail={(template) =>
          setScheduleSource({
            type: "template",
            key: template.key,
            name: template.name,
          })
        }
      />

      <ScheduleDialog
        source={scheduleSource}
        onOpenChange={(open) => !open && setScheduleSource(null)}
        onCreated={() => setScheduleSource(null)}
      />
    </motion.div>
  );
}
