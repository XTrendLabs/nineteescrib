import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import {
  REPORT_CATEGORY_LABELS,
  REPORT_TEMPLATES,
  type ReportCategory,
  type ReportTemplate,
} from "../lib/mock-data";
import { TemplateCard } from "./template-card";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Categories" },
  ...(Object.keys(REPORT_CATEGORY_LABELS) as ReportCategory[]).map((key) => ({
    value: key,
    label: REPORT_CATEGORY_LABELS[key],
  })),
];

const CATEGORY_ORDER: ReportCategory[] = [
  "finance",
  "channel_roi",
  "occupancy",
  "operations",
  "guest_crm",
];

export function StandardTemplatesTab({
  onRun,
}: {
  onRun: (template: ReportTemplate) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return REPORT_TEMPLATES.filter((template) => {
      if (category !== "all" && template.category !== category) return false;
      if (
        q &&
        !template.name.toLowerCase().includes(q) &&
        !template.description.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [search, category]);

  const grouped = useMemo(() => {
    const map = new Map<ReportCategory, ReportTemplate[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const template of filtered) {
      map.get(template.category)?.push(template);
    }
    return map;
  }, [filtered]);

  const hasResults = filtered.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report templates..."
            className="pl-8"
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as string)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All Categories">
              {(value: unknown) =>
                CATEGORY_OPTIONS.find((o) => o.value === value)?.label ??
                "All Categories"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!hasResults && (
        <div className="flex flex-col items-center justify-center gap-1 border py-16 text-center">
          <p className="text-sm">No report templates match your search</p>
          <p className="text-muted-foreground text-xs">
            Try a different keyword or category
          </p>
        </div>
      )}

      {CATEGORY_ORDER.map((cat) => {
        const templates = grouped.get(cat) ?? [];
        if (templates.length === 0) return null;
        return (
          <div key={cat} className="flex flex-col gap-3">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {REPORT_CATEGORY_LABELS[cat]}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template, index) => (
                <TemplateCard
                  key={template.key}
                  template={template}
                  index={index}
                  onRun={onRun}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
