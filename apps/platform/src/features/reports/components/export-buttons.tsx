import { Button } from "@propertyos/ui/components/button";
import { FileSpreadsheetIcon, FileTextIcon, TableIcon } from "lucide-react";
import { toast } from "sonner";

import type { ExportFormat } from "../lib/mock-data";

const FORMAT_CONFIG: Record<
  ExportFormat,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  csv: { label: "Export CSV", icon: TableIcon },
  excel: { label: "Export Excel", icon: FileSpreadsheetIcon },
  pdf: { label: "Export PDF", icon: FileTextIcon },
};

export function ExportButtons({
  formats,
  reportName,
}: {
  formats: ExportFormat[];
  reportName: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {formats.map((format) => {
        const config = FORMAT_CONFIG[format];
        const Icon = config.icon;
        return (
          <Button
            key={format}
            variant="outline"
            size="sm"
            onClick={() =>
              toast.success(`${reportName} exported as ${format.toUpperCase()}`)
            }
          >
            <Icon />
            {config.label}
          </Button>
        );
      })}
    </div>
  );
}
