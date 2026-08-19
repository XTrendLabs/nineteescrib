import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@propertyos/ui/components/sheet";
import { CalendarClockIcon } from "lucide-react";
import { useMemo } from "react";
import { buildReportRows, type ReportTemplate } from "../lib/mock-data";
import { useReportsProperties } from "../lib/use-reports-properties";
import { ExportButtons } from "./export-buttons";
import { ReportDataTable } from "./report-data-table";

export function ReportPreviewSheet({
  template,
  onOpenChange,
  onScheduleEmail,
}: {
  template: ReportTemplate | null;
  onOpenChange: (open: boolean) => void;
  onScheduleEmail: (template: ReportTemplate) => void;
}) {
  const properties = useReportsProperties();
  const rows = useMemo(
    () => (template ? buildReportRows(template, properties) : []),
    [template, properties],
  );

  return (
    <Sheet open={template !== null} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-lg">
            {template && `${template.emoji} ${template.name}`}
          </SheetTitle>
          <SheetDescription>{template?.description}</SheetDescription>
        </SheetHeader>

        {template && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ExportButtons
                formats={template.exportFormats}
                reportName={template.name}
              />
              <button
                type="button"
                onClick={() => onScheduleEmail(template)}
                className="flex items-center gap-1.5 text-muted-foreground text-xs hover:text-foreground hover:underline"
              >
                <CalendarClockIcon className="size-3.5" />
                Schedule Email
              </button>
            </div>

            <ReportDataTable columns={template.columns} rows={rows} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
