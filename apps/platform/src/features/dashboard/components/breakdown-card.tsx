import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";

import { getChartSlot } from "../lib/chart-theme";
import { formatPaise } from "../lib/format";
import { useIsDarkMode } from "../lib/use-is-dark-mode";

export type BreakdownRow = {
  key: string;
  label: string;
  amountPaise: number;
  count: number;
};

/**
 * A share-of-total list: booking sources, or expense categories.
 *
 * A labelled bar list rather than a pie -- these are compared against each
 * other and read off exactly, which a pie makes harder at every step.
 */
export function BreakdownCard({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: BreakdownRow[] | undefined;
  emptyLabel: string;
}) {
  const isDark = useIsDarkMode();
  const total = (rows ?? []).reduce((sum, row) => sum + row.amountPaise, 0);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {!rows || rows.length === 0 || total <= 0 ? (
          <p className="py-10 text-center text-muted-foreground text-xs">
            {emptyLabel}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {(rows ?? []).map((row, index) => {
              const share = (row.amountPaise / total) * 100;
              return (
                <div key={row.key} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate">{row.label}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {formatPaise(row.amountPaise)} · {share.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted">
                    <div
                      className="h-full"
                      style={{
                        width: `${share}%`,
                        backgroundColor: getChartSlot(index, isDark),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
