import { Button } from "@propertyos/ui/components/button";
import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import {
  ADVANCED_TEMPLATES,
  type AdvancedTemplate,
  buildSavedReports,
} from "../lib/mock-data";
import { useReportsProperties } from "../lib/use-reports-properties";
import { AdvancedReportSheet } from "./advanced-report-sheet";
import { AdvancedTemplateCard } from "./advanced-template-card";
import { SavedReportCard } from "./saved-report-card";
import { ScheduleDialog, type ScheduleSource } from "./schedule-dialog";

export function CustomBuilderTab() {
  const properties = useReportsProperties();
  const savedReports = buildSavedReports(properties);
  const [viewingAdvanced, setViewingAdvanced] =
    useState<AdvancedTemplate | null>(null);
  const [scheduleSource, setScheduleSource] = useState<ScheduleSource | null>(
    null,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">
            My Saved Reports (Reusable Templates)
          </p>
          <Button
            variant="outline"
            size="sm"
            render={<Link to="/reports/builder" />}
          >
            <PlusIcon />
            Build New Report
          </Button>
        </div>

        {savedReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 border py-10 text-center">
            <p className="text-sm">No saved reports yet</p>
            <p className="text-muted-foreground text-xs">
              Build a custom report and save it for reuse
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {savedReports.map((report, index) => (
              <SavedReportCard
                key={report.id}
                report={report}
                index={index}
                onSchedule={() =>
                  setScheduleSource({
                    type: "saved_report",
                    id: report.id,
                    name: report.name,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <p className="font-medium text-sm">Advanced Report Templates</p>
          <p className="text-muted-foreground text-xs">
            Rich multi-section reports with nested tables and portfolio-wide
            dashboards
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANCED_TEMPLATES.map((template, index) => (
            <AdvancedTemplateCard
              key={template.key}
              template={template}
              index={index}
              onView={setViewingAdvanced}
            />
          ))}
        </div>
      </div>

      <AdvancedReportSheet
        template={viewingAdvanced}
        onOpenChange={(open) => !open && setViewingAdvanced(null)}
      />

      <ScheduleDialog
        source={scheduleSource}
        onOpenChange={(open) => !open && setScheduleSource(null)}
        onCreated={() => setScheduleSource(null)}
      />
    </div>
  );
}
