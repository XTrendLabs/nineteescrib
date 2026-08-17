import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { cn } from "@propertyos/ui/lib/utils";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getChartSlot, usesStripePattern } from "../lib/chart-theme";
import { formatInr } from "../lib/format";
import type { MockProperty, RevenueMetric, TimeScale } from "../lib/mock-data";
import { buildRevenueSeries } from "../lib/mock-data";
import { useIsDarkMode } from "../lib/use-is-dark-mode";

const TIME_SCALES: { value: TimeScale; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const METRICS: { value: RevenueMetric; label: string }[] = [
  { value: "revenue", label: "Revenue" },
  { value: "nights", label: "Nights booked" },
];

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center border">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "px-2.5 py-1 text-xs transition-colors",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function RevenueTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: {
    name?: string;
    value?: number;
    payload: Record<string, number>;
    dataKey?: string;
  }[];
  metric: RevenueMetric;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0);

  return (
    <div className="min-w-44 border bg-popover p-2.5 text-popover-foreground shadow-md ring-1 ring-foreground/10">
      <div className="flex flex-col gap-1.5">
        {payload
          .slice()
          .reverse()
          .map((entry) => {
            const value = entry.value ?? 0;
            const share = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div
                key={entry.dataKey}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="truncate text-muted-foreground">
                  {entry.name}
                </span>
                <span className="tabular-nums">
                  {metric === "revenue" ? formatInr(value) : `${value}n`}{" "}
                  <span className="text-muted-foreground">({share}%)</span>
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export function RevenueChartCard({
  properties,
}: {
  properties: MockProperty[];
}) {
  const [scale, setScale] = useState<TimeScale>("daily");
  const [metric, setMetric] = useState<RevenueMetric>("revenue");
  const isDark = useIsDarkMode();

  const buckets = useMemo(
    () => buildRevenueSeries(properties, metric)[scale],
    [properties, metric, scale],
  );

  const data = useMemo(
    () =>
      buckets.map((bucket) => ({
        label: bucket.label,
        ...bucket.values,
      })),
    [buckets],
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Portfolio revenue</CardTitle>
        <CardAction className="flex items-center gap-2">
          <ToggleGroup options={METRICS} value={metric} onChange={setMetric} />
          <ToggleGroup
            options={TIME_SCALES}
            value={scale}
            onChange={setScale}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} margin={{ left: -12, right: 8 }}>
              <defs>
                <pattern
                  id="hq-stripe-pattern"
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
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-border"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
                tickFormatter={(v: number) =>
                  metric === "revenue" ? `₹${Math.round(v / 1000)}k` : `${v}`
                }
              />
              <Tooltip
                cursor={{ fill: "currentColor", opacity: 0.06 }}
                content={<RevenueTooltip metric={metric} />}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value: string) => (
                  <span className="text-muted-foreground">{value}</span>
                )}
              />
              {properties.map((property, index) => (
                <Bar
                  key={property.id}
                  dataKey={property.id}
                  name={property.name}
                  stackId="portfolio"
                  fill={
                    usesStripePattern(index)
                      ? "url(#hq-stripe-pattern)"
                      : getChartSlot(index, isDark)
                  }
                  stroke={
                    usesStripePattern(index)
                      ? getChartSlot(index, isDark)
                      : "transparent"
                  }
                  strokeWidth={usesStripePattern(index) ? 1 : 0}
                  radius={
                    index === properties.length - 1
                      ? [2, 2, 0, 0]
                      : [0, 0, 0, 0]
                  }
                  maxBarSize={24}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
