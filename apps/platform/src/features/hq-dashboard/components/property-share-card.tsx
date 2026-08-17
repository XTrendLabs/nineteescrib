import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { cn } from "@propertyos/ui/lib/utils";
import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { getChartSlot, usesStripePattern } from "../lib/chart-theme";
import { formatInr, formatPercent } from "../lib/format";
import type { MockProperty } from "../lib/mock-data";
import { buildPropertyShares } from "../lib/mock-data";
import { useIsDarkMode } from "../lib/use-is-dark-mode";

type ShareMode = "revenue" | "occupancy";

const MODES: { value: ShareMode; label: string }[] = [
  { value: "revenue", label: "Revenue" },
  { value: "occupancy", label: "Occupancy" },
];

export function PropertyShareCard({
  properties,
}: {
  properties: MockProperty[];
}) {
  const [mode, setMode] = useState<ShareMode>("revenue");
  const isDark = useIsDarkMode();

  const shares = useMemo(() => buildPropertyShares(properties), [properties]);

  const total = shares.reduce((sum, s) => sum + s[mode], 0);
  const data = shares.map((s) => ({
    name: s.name,
    value: s[mode],
    share: total > 0 ? Math.round((s[mode] / total) * 100) : 0,
  }));

  const dominant = data.reduce(
    (best, entry) => (entry.value > (best?.value ?? -1) ? entry : best),
    data[0],
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base">Property share</CardTitle>
        <CardAction>
          <div className="flex items-center border">
            {MODES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={cn(
                  "px-2.5 py-1 text-xs transition-colors",
                  mode === option.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="relative h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <pattern
                  id="hq-donut-stripe-pattern"
                  patternUnits="userSpaceOnUse"
                  width="6"
                  height="6"
                  patternTransform="rotate(45)"
                >
                  <rect
                    width="6"
                    height="6"
                    fill={getChartSlot(3, isDark)}
                    fillOpacity={0.35}
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke={getChartSlot(1, isDark)}
                    strokeWidth={2}
                  />
                </pattern>
              </defs>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="90%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={
                      usesStripePattern(index)
                        ? "url(#hq-donut-stripe-pattern)"
                        : getChartSlot(index, isDark)
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }
                  const entry = payload[0]?.payload as
                    | { name: string; value: number; share: number }
                    | undefined;
                  if (!entry) {
                    return null;
                  }
                  return (
                    <div className="min-w-40 border bg-popover p-2.5 text-popover-foreground text-xs shadow-md ring-1 ring-foreground/10">
                      <p className="mb-1 font-medium">{entry.name}</p>
                      <p className="text-muted-foreground">
                        {mode === "revenue"
                          ? formatInr(entry.value)
                          : formatPercent(entry.value)}{" "}
                        · {entry.share}% share
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-display-sm leading-none">
              {dominant ? formatPercent(dominant.share, 0) : "—"}
            </p>
            <p className="mt-1 max-w-32 truncate text-center text-muted-foreground text-xs">
              {dominant?.name ?? "No data"}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-1.5">
          {data.map((entry, index) => (
            <div
              key={entry.name}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0"
                  style={{
                    backgroundColor: usesStripePattern(index)
                      ? getChartSlot(3, isDark)
                      : getChartSlot(index, isDark),
                  }}
                />
                <span className="truncate text-muted-foreground">
                  {entry.name}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">{entry.share}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
