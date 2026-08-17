import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { cn } from "@propertyos/ui/lib/utils";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  DoorClosedIcon,
  DoorOpenIcon,
} from "lucide-react";
import { motion } from "motion/react";

import { formatInr, formatPercent, formatSignedPercent } from "../lib/format";
import type { PortfolioMetrics } from "../lib/mock-data";

function DeltaBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium text-xs",
        isPositive ? "text-success" : "text-destructive",
      )}
    >
      {isPositive ? (
        <ArrowUpRightIcon className="size-3.5" />
      ) : (
        <ArrowDownRightIcon className="size-3.5" />
      )}
      {formatSignedPercent(value)}
    </span>
  );
}

function MetricCard({
  label,
  value,
  delta,
  index,
  children,
}: {
  label: string;
  value: string;
  delta?: number;
  index: number;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        type: "spring",
        stiffness: 220,
        damping: 26,
      }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-normal text-muted-foreground">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between">
          <div className="flex items-end justify-between gap-2">
            <p className="text-display-sm tabular-nums leading-none">{value}</p>
            {delta !== undefined && (
              <div className="mb-0.5 flex items-center gap-1">
                <DeltaBadge value={delta} />
                <span className="text-[10px] text-muted-foreground">
                  vs 30d
                </span>
              </div>
            )}
          </div>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function MetricsBand({ metrics }: { metrics: PortfolioMetrics }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        index={0}
        label="Total portfolio revenue"
        value={formatInr(metrics.totalRevenue)}
        delta={metrics.totalRevenuePrevDelta}
      />
      <MetricCard
        index={1}
        label="Average occupancy"
        value={formatPercent(metrics.avgOccupancy)}
        delta={metrics.avgOccupancyPrevDelta}
      />
      <MetricCard
        index={2}
        label="Commission saved"
        value={formatInr(metrics.commissionSaved)}
        delta={metrics.commissionSavedPrevDelta}
      />
      <MetricCard
        index={3}
        label="Today's operations"
        value={`${metrics.todayCheckIns} / ${metrics.todayCheckOuts}`}
      >
        <div className="mt-2 flex items-center gap-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <DoorOpenIcon className="size-3.5" />
            {metrics.todayCheckIns} arrivals
          </span>
          <span className="flex items-center gap-1">
            <DoorClosedIcon className="size-3.5" />
            {metrics.todayCheckOuts} departures
          </span>
        </div>
      </MetricCard>
    </div>
  );
}
