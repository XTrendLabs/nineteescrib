import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@propertyos/ui/components/sheet";
import { useMemo } from "react";

import type { AdvancedTemplate } from "../lib/mock-data";
import { useReportsProperties } from "../lib/use-reports-properties";
import { AdvancedSectionRenderer } from "./advanced-section-renderer";
import { ExportButtons } from "./export-buttons";

export function AdvancedReportSheet({
  template,
  onOpenChange,
}: {
  template: AdvancedTemplate | null;
  onOpenChange: (open: boolean) => void;
}) {
  const properties = useReportsProperties();
  const sections = useMemo(
    () => (template ? template.buildSections(properties) : []),
    [template, properties],
  );

  return (
    <Sheet open={template !== null} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle className="font-display text-lg">
            {template && `${template.emoji} ${template.name}`}
          </SheetTitle>
          <SheetDescription>{template?.description}</SheetDescription>
        </SheetHeader>

        {template && (
          <div className="flex flex-col gap-6 px-4 pb-4">
            <ExportButtons
              formats={["csv", "excel", "pdf"]}
              reportName={template.name}
            />
            {sections.map((section) => (
              <AdvancedSectionRenderer key={section.title} section={section} />
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
