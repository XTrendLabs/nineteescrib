import { Checkbox } from "@propertyos/ui/components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { cn } from "@propertyos/ui/lib/utils";

import {
  BUILDER_DIMENSIONS,
  BUILDER_METRICS,
  type BuilderConfig,
  type BuilderDimension,
  type BuilderMetricKey,
  RELATIVE_DATE_OPTIONS,
  type Visualization,
} from "../lib/mock-data";
import { useReportsProperties } from "../lib/use-reports-properties";

const VISUALIZATIONS: { value: Visualization; label: string }[] = [
  { value: "table", label: "Data Table" },
  { value: "bar_chart", label: "Bar Chart" },
  { value: "line_graph", label: "Line Graph" },
  { value: "cards", label: "Summary Cards" },
];

const CHANNEL_OPTIONS = [
  { value: "direct", label: "Direct" },
  { value: "airbnb", label: "Airbnb" },
  { value: "booking_com", label: "Booking.com" },
  { value: "manual", label: "Manual" },
];

function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function ReportBuilderForm({
  config,
  onChange,
}: {
  config: BuilderConfig;
  onChange: (config: BuilderConfig) => void;
}) {
  const properties = useReportsProperties();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">Step 1: Select Metrics</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BUILDER_METRICS.map((metric) => (
            <button
              key={metric.key}
              type="button"
              onClick={() =>
                onChange({
                  ...config,
                  metrics: toggleInArray<BuilderMetricKey>(
                    config.metrics,
                    metric.key,
                  ),
                })
              }
              className="flex items-center gap-2 text-left text-xs"
            >
              <Checkbox
                checked={config.metrics.includes(metric.key)}
                tabIndex={-1}
              />
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">
          Step 2: Group & Breakdown By (Dimensions)
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">
              Primary Grouping
            </span>
            <Select
              value={config.primaryDimension}
              onValueChange={(v) =>
                onChange({ ...config, primaryDimension: v as BuilderDimension })
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue>
                  {(value: unknown) =>
                    BUILDER_DIMENSIONS.find((d) => d.key === value)?.label ??
                    "Dimension"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {BUILDER_DIMENSIONS.map((dim) => (
                  <SelectItem key={dim.key} value={dim.key}>
                    {dim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">
              Secondary Grouping
            </span>
            <Select
              value={config.secondaryDimension ?? "none"}
              onValueChange={(v) =>
                onChange({
                  ...config,
                  secondaryDimension:
                    v === "none" ? null : (v as BuilderDimension),
                })
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue>
                  {(value: unknown) =>
                    value === "none"
                      ? "None"
                      : (BUILDER_DIMENSIONS.find((d) => d.key === value)
                          ?.label ?? "Dimension")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {BUILDER_DIMENSIONS.map((dim) => (
                  <SelectItem key={dim.key} value={dim.key}>
                    {dim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">Step 3: Filters</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Date Range</span>
            <Select
              value={config.dateRange}
              onValueChange={(v) =>
                onChange({
                  ...config,
                  dateRange: v as BuilderConfig["dateRange"],
                })
              }
            >
              <SelectTrigger className="w-52">
                <SelectValue>
                  {(value: unknown) =>
                    RELATIVE_DATE_OPTIONS.find((o) => o.value === value)
                      ?.label ?? "Date range"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {RELATIVE_DATE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Properties</span>
            <Select
              value={
                config.propertyIds.length === 0
                  ? "all"
                  : config.propertyIds.join(",")
              }
              onValueChange={(v) =>
                onChange({
                  ...config,
                  propertyIds: v === "all" ? [] : [v as string],
                })
              }
            >
              <SelectTrigger className="w-52">
                <SelectValue>
                  {() =>
                    config.propertyIds.length === 0
                      ? `All Properties (${properties.length})`
                      : (properties.find((p) => p.id === config.propertyIds[0])
                          ?.name ?? "Property")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Properties ({properties.length})
                </SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Channels</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CHANNEL_OPTIONS.map((channel) => (
                <button
                  key={channel.value}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...config,
                      channels: toggleInArray(config.channels, channel.value),
                    })
                  }
                  className={cn(
                    "border px-2 py-1 text-xs transition-colors",
                    config.channels.includes(channel.value)
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {channel.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">Step 4: Visualization Format</p>
        <div className="flex flex-wrap gap-1.5">
          {VISUALIZATIONS.map((viz) => (
            <button
              key={viz.value}
              type="button"
              onClick={() => onChange({ ...config, visualization: viz.value })}
              className={cn(
                "border px-3 py-1.5 text-xs transition-colors",
                config.visualization === viz.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {viz.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
