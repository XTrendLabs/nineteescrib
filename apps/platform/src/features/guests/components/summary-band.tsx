import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { motion } from "motion/react";

import { formatPercent } from "@/features/hq-dashboard/lib/format";
import { formatInr } from "../lib/format";
import type { GuestsSummary } from "../lib/mock-data";

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

export function SummaryBand({ summary }: { summary: GuestsSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        index={0}
        label="Total CRM Database"
        value={String(summary.totalGuests)}
        caption="Unique guests on record"
      />
      <SummaryCard
        index={1}
        label="Repeat Rate"
        value={formatPercent(summary.repeatRatePercent)}
        caption="Guests with 2+ stays"
      />
      <SummaryCard
        index={2}
        label="Portfolio LTV"
        value={formatInr(summary.portfolioLtvPaise)}
        caption="Cumulative direct revenue"
      />
      <SummaryCard
        index={3}
        label="VIP Guests"
        value={String(summary.vipCount)}
        caption="Carrying the VIP tag"
      />
    </div>
  );
}
