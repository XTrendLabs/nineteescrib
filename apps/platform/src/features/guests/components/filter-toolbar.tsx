import { Button } from "@propertyos/ui/components/button";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { SearchIcon, XIcon } from "lucide-react";

export type GuestFilters = {
  search: string;
  tag: string;
  spend: string;
};

export const DEFAULT_FILTERS: GuestFilters = {
  search: "",
  tag: "all",
  spend: "all",
};

import { DERIVED_TAGS, tagLabel } from "../lib/guest";

/**
 * The tag filter's options, built from the tags actually in use plus the
 * derived ones. Tags are free text, so a hard-coded list would drift from
 * whatever operators have really typed.
 */
function tagOptions(tagsInUse: string[]) {
  const tags = [...new Set([...DERIVED_TAGS, ...tagsInUse])];
  return [
    { value: "all", label: "All tags" },
    ...tags.map((tag) => ({ value: tag, label: tagLabel(tag) })),
  ];
}

const SPEND_OPTIONS = [
  { value: "all", label: "All spend" },
  { value: "over_50k", label: "Over ₹50,000" },
  { value: "10k_50k", label: "₹10,000 - ₹50,000" },
  { value: "under_10k", label: "Under ₹10,000" },
];

export function FilterToolbar({
  filters,
  tagsInUse,
  onChange,
}: {
  filters: GuestFilters;
  tagsInUse: string[];
  onChange: (filters: GuestFilters) => void;
}) {
  const TAG_OPTIONS = tagOptions(tagsInUse);

  const isFiltered =
    filters.search !== "" || filters.tag !== "all" || filters.spend !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search by name, phone, or email..."
          className="pl-8"
        />
      </div>

      <Select
        value={filters.tag}
        onValueChange={(value) =>
          onChange({ ...filters, tag: value as string })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Tag">
            {(value: unknown) =>
              TAG_OPTIONS.find((o) => o.value === value)?.label ?? "Tag"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {TAG_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.spend}
        onValueChange={(value) =>
          onChange({ ...filters, spend: value as string })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Spend">
            {(value: unknown) =>
              SPEND_OPTIONS.find((o) => o.value === value)?.label ?? "Spend"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SPEND_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="text-muted-foreground"
        >
          <XIcon />
          Reset
        </Button>
      )}
    </div>
  );
}
