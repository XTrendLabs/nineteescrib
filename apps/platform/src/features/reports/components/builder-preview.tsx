import { Card, CardContent } from "@propertyos/ui/components/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getChartSlot } from "../lib/chart-theme";
import { formatInr } from "../lib/format";
import {
  BUILDER_METRICS,
  type BuilderMetricKey,
  buildBuilderPreviewRows,
} from "../lib/mock-data";
import { useIsDarkMode } from "../lib/use-is-dark-mode";
import { useReportsProperties } from "../lib/use-reports-properties";

function metricLabel(key: BuilderMetricKey) {
  return BUILDER_METRICS.find((m) => m.key === key)?.label ?? key;
}

function formatMetricValue(key: BuilderMetricKey, value: number) {
  if (key === "occupancy_percent") return `${value}%`;
  if (key === "guest_count" || key === "length_of_stay") return String(value);
  return formatInr(value);
}

function BuilderTable({
  metrics,
  groups,
}: {
  metrics: BuilderMetricKey[];
  groups: ReturnType<typeof buildBuilderPreviewRows>;
}) {
  return (
    <div className="overflow-x-auto border">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Property / Month
            </th>
            {metrics.map((metric) => (
              <th
                key={metric}
                className="whitespace-nowrap px-3 py-2.5 font-medium text-muted-foreground"
              >
                {metricLabel(metric)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <>
              <tr
                key={`${group.group}-header`}
                className="border-b bg-muted/20"
              >
                <td
                  colSpan={metrics.length + 1}
                  className="px-3 py-1.5 font-medium"
                >
                  {group.group}
                </td>
              </tr>
              {group.rows.map((row) => (
                <tr
                  key={`${group.group}-${row.label}`}
                  className="border-b transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2.5 pl-6 text-muted-foreground">
                    {row.label}
                  </td>
                  {metrics.map((metric) => (
                    <td
                      key={metric}
                      className="whitespace-nowrap px-3 py-2.5 tabular-nums"
                    >
                      {formatMetricValue(metric, row.values[metric])}
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BuilderChart({
  metrics,
  groups,
  kind,
}: {
  metrics: BuilderMetricKey[];
  groups: ReturnType<typeof buildBuilderPreviewRows>;
  kind: "bar" | "line";
}) {
  const isDark = useIsDarkMode();
  const primaryMetric = metrics[0];

  const data = groups.flatMap((group) =>
    group.rows.map((row) => ({
      label: `${group.group} · ${row.label}`,
      value: primaryMetric ? row.values[primaryMetric] : 0,
    })),
  );

  const ChartComponent = kind === "bar" ? BarChart : LineChart;

  return (
    <div className="h-72 w-full border p-3">
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ left: -12, right: 8 }}>
          <CartesianGrid
            vertical={false}
            stroke="currentColor"
            className="text-border"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "currentColor" }}
            className="text-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-muted-foreground"
          />
          <Tooltip
            cursor={{ fill: "currentColor", opacity: 0.06 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const value = payload[0]?.value;
              return (
                <div className="min-w-40 border bg-popover p-2.5 text-popover-foreground text-xs shadow-md ring-1 ring-foreground/10">
                  {primaryMetric && typeof value === "number"
                    ? formatMetricValue(primaryMetric, value)
                    : value}
                </div>
              );
            }}
          />
          {kind === "bar" ? (
            <Bar
              dataKey="value"
              fill={getChartSlot(0, isDark)}
              radius={[2, 2, 0, 0]}
              maxBarSize={32}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={getChartSlot(0, isDark)}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

function BuilderCards({
  metrics,
  groups,
}: {
  metrics: BuilderMetricKey[];
  groups: ReturnType<typeof buildBuilderPreviewRows>;
}) {
  const totals: Partial<Record<BuilderMetricKey, number>> = {};
  for (const group of groups) {
    for (const row of group.rows) {
      for (const metric of metrics) {
        totals[metric] = (totals[metric] ?? 0) + row.values[metric];
      }
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {metrics.map((metric) => (
        <Card key={metric}>
          <CardContent className="flex flex-col gap-1.5 pt-4">
            <p className="text-muted-foreground text-xs">
              {metricLabel(metric)}
            </p>
            <p className="text-display-sm tabular-nums leading-none">
              {formatMetricValue(metric, totals[metric] ?? 0)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function BuilderPreview({
  metrics,
  propertyIds,
  visualization,
}: {
  metrics: BuilderMetricKey[];
  propertyIds: string[];
  visualization: "table" | "bar_chart" | "line_graph" | "cards";
}) {
  const properties = useReportsProperties();
  const groups = buildBuilderPreviewRows(metrics, propertyIds, properties);

  if (metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 border py-12 text-center">
        <p className="text-sm">Select at least one metric</p>
        <p className="text-muted-foreground text-xs">
          Choose metrics to generate a preview
        </p>
      </div>
    );
  }

  if (visualization === "bar_chart") {
    return <BuilderChart metrics={metrics} groups={groups} kind="bar" />;
  }
  if (visualization === "line_graph") {
    return <BuilderChart metrics={metrics} groups={groups} kind="line" />;
  }
  if (visualization === "cards") {
    return <BuilderCards metrics={metrics} groups={groups} />;
  }
  return <BuilderTable metrics={metrics} groups={groups} />;
}
