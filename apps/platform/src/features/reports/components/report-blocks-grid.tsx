import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { PlusIcon, XIcon } from "lucide-react";

import {
  BUILDER_METRICS,
  type BuilderMetricKey,
  type PreviewBlock,
  type Visualization,
} from "../lib/mock-data";
import { BuilderPreview } from "./builder-preview";

const VISUALIZATIONS: { value: Visualization; label: string }[] = [
  { value: "table", label: "Table" },
  { value: "bar_chart", label: "Bar Chart" },
  { value: "line_graph", label: "Line Graph" },
  { value: "cards", label: "Cards" },
];

function toggleMetric(list: BuilderMetricKey[], value: BuilderMetricKey) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function ReportBlockCard({
  block,
  propertyIds,
  onChange,
  onRemove,
  canRemove,
}: {
  block: PreviewBlock;
  propertyIds: string[];
  onChange: (block: PreviewBlock) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <Input
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            className="border-transparent bg-transparent px-0 font-medium text-sm hover:border-input focus-visible:border-ring"
          />
          <div className="flex items-center gap-2">
            <Select
              value={block.visualization}
              onValueChange={(v) =>
                onChange({ ...block, visualization: v as Visualization })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue>
                  {(value: unknown) =>
                    VISUALIZATIONS.find((o) => o.value === value)?.label ??
                    "Type"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {VISUALIZATIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canRemove && (
              <Button variant="ghost" size="icon-sm" onClick={onRemove}>
                <XIcon />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {BUILDER_METRICS.map((metric) => (
            <button
              key={metric.key}
              type="button"
              onClick={() =>
                onChange({
                  ...block,
                  metrics: toggleMetric(block.metrics, metric.key),
                })
              }
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <Checkbox
                checked={block.metrics.includes(metric.key)}
                tabIndex={-1}
                className="size-3.5"
              />
              {metric.label}
            </button>
          ))}
        </div>

        <BuilderPreview
          metrics={block.metrics}
          propertyIds={propertyIds}
          visualization={block.visualization}
        />
      </CardContent>
    </Card>
  );
}

let blockIdCounter = 0;

export function createPreviewBlock(): PreviewBlock {
  blockIdCounter += 1;
  return {
    id: `block-new-${Date.now()}-${blockIdCounter}`,
    title: "New Table",
    metrics: ["total_revenue", "occupancy_percent"],
    visualization: "table",
  };
}

export function ReportBlocksGrid({
  blocks,
  propertyIds,
  onChange,
}: {
  blocks: PreviewBlock[];
  propertyIds: string[];
  onChange: (blocks: PreviewBlock[]) => void;
}) {
  function updateBlock(id: string, next: PreviewBlock) {
    onChange(blocks.map((b) => (b.id === id ? next : b)));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }

  function addBlock() {
    onChange([...blocks, createPreviewBlock()]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {blocks.map((block) => (
          <ReportBlockCard
            key={block.id}
            block={block}
            propertyIds={propertyIds}
            onChange={(next) => updateBlock(block.id, next)}
            onRemove={() => removeBlock(block.id)}
            canRemove={blocks.length > 1}
          />
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-fit" onClick={addBlock}>
        <PlusIcon />
        Add Table or Chart
      </Button>
    </div>
  );
}
