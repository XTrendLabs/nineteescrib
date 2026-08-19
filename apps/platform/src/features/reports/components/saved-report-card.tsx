import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarClockIcon, PencilIcon, ZapIcon } from "lucide-react";
import { motion } from "motion/react";

import {
  BUILDER_DIMENSIONS,
  BUILDER_METRICS,
  type SavedReport,
} from "../lib/mock-data";

function dimensionLabel(key: string) {
  return BUILDER_DIMENSIONS.find((d) => d.key === key)?.label ?? key;
}

export function SavedReportCard({
  report,
  index,
  onSchedule,
}: {
  report: SavedReport;
  index: number;
  onSchedule: (report: SavedReport) => void;
}) {
  const metricLabels = report.config.metrics
    .map((m) => BUILDER_METRICS.find((metric) => metric.key === m)?.label ?? m)
    .join(", ");

  const grouping = report.config.secondaryDimension
    ? `${dimensionLabel(report.config.primaryDimension)} × ${dimensionLabel(report.config.secondaryDimension)}`
    : dimensionLabel(report.config.primaryDimension);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 220,
        damping: 26,
      }}
    >
      <Card className="h-full">
        <CardContent className="flex h-full flex-col gap-2.5 pt-4">
          <p className="flex items-center gap-1.5 font-medium text-sm">
            <ZapIcon className="size-3.5 shrink-0" />
            {report.name}
          </p>
          <p className="text-muted-foreground text-xs">
            Grouped by: {grouping}
          </p>
          <p className="text-muted-foreground text-xs">
            Metrics: {metricLabels}
          </p>
          <p className="flex-1 text-muted-foreground text-xs">
            Saved {format(report.savedAt, "MMM d")} by {report.savedByName}
          </p>
          <div className="flex flex-wrap gap-2 border-t pt-2.5">
            <Button
              variant="outline"
              size="sm"
              render={
                <Link
                  to="/reports/builder"
                  search={{ savedReportId: report.id }}
                />
              }
            >
              <ZapIcon />
              Run Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              render={
                <Link
                  to="/reports/builder"
                  search={{ savedReportId: report.id }}
                />
              }
            >
              <PencilIcon />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSchedule(report)}
            >
              <CalendarClockIcon />
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
