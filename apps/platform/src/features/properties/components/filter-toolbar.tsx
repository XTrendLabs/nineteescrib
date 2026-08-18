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

export type PropertyFilters = {
  search: string;
  type: string;
  status: string;
};

export const DEFAULT_FILTERS: PropertyFilters = {
  search: "",
  type: "all",
  status: "all",
};

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "hotel", label: "Hotel" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "homestay", label: "Homestay" },
  { value: "hostel", label: "Hostel" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "maintenance", label: "Under Maintenance" },
];

export function FilterToolbar({
  filters,
  onChange,
}: {
  filters: PropertyFilters;
  onChange: (filters: PropertyFilters) => void;
}) {
  const isFiltered =
    filters.search !== "" || filters.type !== "all" || filters.status !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search properties..."
          className="pl-8"
        />
      </div>

      <Select
        value={filters.type}
        onValueChange={(value) =>
          onChange({ ...filters, type: value as string })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Type">
            {(value: unknown) =>
              TYPE_OPTIONS.find((o) => o.value === value)?.label ?? "Type"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) =>
          onChange({ ...filters, status: value as string })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Status">
            {(value: unknown) =>
              STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "Status"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
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
          Clear all
        </Button>
      )}
    </div>
  );
}
