import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { motion } from "motion/react";

import { formatPercent } from "@/features/hq-dashboard/lib/format";
import type { BookingsSummary } from "../lib/booking";

function SummaryCard({
  label,
  value,
  caption,
  index,
}: {
  label: string;
  value: string;
  caption: string;
  index: number;
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
        <CardContent>
          <p className="text-display-sm tabular-nums leading-none">{value}</p>
          <p className="mt-1.5 text-muted-foreground text-xs">{caption}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function SummaryBand({ summary }: { summary: BookingsSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        index={0}
        label="Active Stays"
        value={String(summary.activeStays)}
        caption="Rooms currently occupied"
      />
      <SummaryCard
        index={1}
        label="Unpaid Balance"
        value={String(summary.unpaidCount)}
        caption="Bookings with dues outstanding"
      />
      <SummaryCard
        index={2}
        label="Pending Holds"
        value={String(summary.pendingHolds)}
        caption="Awaiting confirmation"
      />
      <SummaryCard
        index={3}
        label="Cancelled (30d)"
        value={formatPercent(summary.cancellationRate)}
        caption="Share of cancelled bookings"
      />
    </div>
  );
}
