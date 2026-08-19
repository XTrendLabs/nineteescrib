import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClockIcon, SaveIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ExportButtons } from "@/features/reports/components/export-buttons";
import { ProBadge } from "@/features/reports/components/pro-badge";
import { ReportBlocksGrid } from "@/features/reports/components/report-blocks-grid";
import { ReportBuilderForm } from "@/features/reports/components/report-builder-form";
import {
  ScheduleDialog,
  type ScheduleSource,
} from "@/features/reports/components/schedule-dialog";
import {
  type BuilderConfig,
  buildSavedReports,
  DEFAULT_BUILDER_CONFIG,
} from "@/features/reports/lib/mock-data";
import { useReportsProperties } from "@/features/reports/lib/use-reports-properties";

const searchSchema = z.object({
  savedReportId: z.string().optional(),
});

export const Route = createFileRoute("/(protected)/reports/builder")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function SaveTemplateDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setName("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Report Template</DialogTitle>
          <DialogDescription>
            Save this configuration to the shared reports library for instant
            reuse.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5 px-4">
          <span className="text-muted-foreground text-xs">Template name</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Meera's Monthly Coorg Payout"
          />
        </div>
        <DialogFooter>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onSave(name.trim());
              setName("");
            }}
          >
            <SaveIcon />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RouteComponent() {
  const { savedReportId } = Route.useSearch();
  const properties = useReportsProperties();

  const savedReport = useMemo(() => {
    if (!savedReportId) return undefined;
    return buildSavedReports(properties).find((r) => r.id === savedReportId);
  }, [savedReportId, properties]);

  const [config, setConfig] = useState<BuilderConfig>(
    savedReport?.config ?? DEFAULT_BUILDER_CONFIG,
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [scheduleSource, setScheduleSource] = useState<ScheduleSource | null>(
    null,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex h-full flex-col gap-4 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link
            to="/reports"
            className="w-fit text-muted-foreground text-xs hover:text-foreground hover:underline"
          >
            ← Reports
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-display-md">
              {savedReport ? savedReport.name : "Custom Report Builder"}
            </h1>
            <ProBadge />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons formats={["csv", "pdf"]} reportName="Custom report" />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setScheduleSource({
                type: "template",
                key: "custom",
                name: savedReport?.name ?? "Custom Report",
              })
            }
          >
            <CalendarClockIcon />
            Schedule Email
          </Button>
          <Button size="sm" onClick={() => setSaveDialogOpen(true)}>
            <SaveIcon />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="border p-4 lg:sticky lg:top-4 lg:h-fit lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <ReportBuilderForm config={config} onChange={setConfig} />
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-medium text-sm">Live Preview</p>
          <ReportBlocksGrid
            blocks={config.blocks}
            propertyIds={config.propertyIds}
            onChange={(blocks) => setConfig({ ...config, blocks })}
          />
        </div>
      </div>

      <SaveTemplateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={(name) => {
          setSaveDialogOpen(false);
          toast.success(`"${name}" saved to your reports library`);
        }}
      />

      <ScheduleDialog
        source={scheduleSource}
        onOpenChange={(open) => !open && setScheduleSource(null)}
        onCreated={() => setScheduleSource(null)}
      />
    </motion.div>
  );
}
