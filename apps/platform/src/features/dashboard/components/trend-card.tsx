import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { cn } from "@propertyos/ui/lib/utils";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getChartSlot } from "../lib/chart-theme";
import { formatDayLabel, formatPaise, formatPaiseCompact } from "../lib/format";
import { useIsDarkMode } from "../lib/use-is-dark-mode";

export type TrendPoint = {
  bucket: string;
  revenuePaise: number;
  expensePaise: number;
  bookingCount: number;
};

type Mode = "money" | "bookings";

export function TrendCard({
  data,
  bucket,
}: {
  data: TrendPoint[];
  bucket: "day" | "week" | "month";
}) {
  const isDark = useIsDarkMode();
  const [mode, setMode] = useState<Mode>("money");

  const revenueColor = getChartSlot(0, isDark);
  const expenseColor = getChartSlot(2, isDark);

  const rows = data.map((point) => ({
    ...point,
    label: formatDayLabel(point.bucket, bucket),
    revenue: point.revenuePaise / 100,
    expense: point.expensePaise / 100,
  }));

  const hasAny = rows.some(
    (r) => r.revenuePaise > 0 || r.expensePaise > 0 || r.bookingCount > 0,
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base">Revenue vs expenses</CardTitle>
        <CardAction>
          <div className="flex items-center border">
            {(
              [
                { value: "money", label: "Money" },
                { value: "bookings", label: "Bookings" },
              ] as { value: Mode; label: string }[]
            ).map((option) => (
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
      <CardContent className="flex-1">
        {!hasAny ? (
          <p className="py-16 text-center text-muted-foreground text-xs">
            Nothing recorded in this period yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={rows} margin={{ left: 4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={revenueColor}
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="100%"
                    stopColor={revenueColor}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? "#3f3f46" : "#e5e7eb"}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke={isDark ? "#a1a1aa" : "#6b7280"}
                minTickGap={16}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={64}
                stroke={isDark ? "#a1a1aa" : "#6b7280"}
                tickFormatter={(value: number) =>
                  mode === "money"
                    ? formatPaiseCompact(value * 100)
                    : String(value)
                }
              />
              <Tooltip
                contentStyle={{
                  background: isDark ? "#1a1a1a" : "#ffffff",
                  border: `1px solid ${isDark ? "#3f3f46" : "#e5e7eb"}`,
                  borderRadius: 0,
                  fontSize: 12,
                }}
                formatter={(value, name) => {
                  // Recharts types a tooltip value as possibly undefined and
                  // non-numeric, so this narrows rather than asserting.
                  const numeric = typeof value === "number" ? value : 0;
                  return [
                    mode === "money" ? formatPaise(numeric * 100) : numeric,
                    name,
                  ];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconType="square"
                iconSize={8}
              />
              {mode === "money" ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={revenueColor}
                    fill="url(#revenueFill)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expenses"
                    stroke={expenseColor}
                    fill="none"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="bookingCount"
                  name="Bookings"
                  stroke={revenueColor}
                  fill="url(#revenueFill)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
