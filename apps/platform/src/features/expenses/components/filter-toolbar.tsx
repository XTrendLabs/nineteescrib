import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { SearchIcon } from "lucide-react";
import { type ExpenseStatus, HQ_SHARED_ID } from "../lib/expense";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  type ExpenseCategory,
  STATUS_LABELS,
} from "../lib/mock-data";

/** Just enough of a property to label it in the picker. */
export type FilterProperty = { id: string; name: string };

export type ExpenseFilters = {
  search: string;
  propertyId: string | "all";
  category: ExpenseCategory | "all";
  status: ExpenseStatus | "all";
};

export const DEFAULT_EXPENSE_FILTERS: ExpenseFilters = {
  search: "",
  propertyId: "all",
  category: "all",
  status: "all",
};

const STATUS_OPTIONS: ExpenseStatus[] = ["paid", "partial", "unpaid"];

export function FilterToolbar({
  filters,
  properties,
  onChange,
}: {
  filters: ExpenseFilters;
  properties: FilterProperty[];
  onChange: (filters: ExpenseFilters) => void;
}) {
  const propertyLabel =
    filters.propertyId === "all"
      ? "All Properties"
      : filters.propertyId === HQ_SHARED_ID
        ? "HQ / Shared"
        : (properties.find((p) => p.id === filters.propertyId)?.name ??
          "All Properties");

  const categoryLabel =
    filters.category === "all"
      ? "All Categories"
      : CATEGORY_LABELS[filters.category];

  const statusLabel =
    filters.status === "all" ? "All Statuses" : STATUS_LABELS[filters.status];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[240px] flex-1">
        <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search title, vendor, ref..."
          className="pl-8"
        />
      </div>

      <Select
        value={filters.propertyId}
        onValueChange={(v) => onChange({ ...filters, propertyId: v as string })}
      >
        <SelectTrigger className="w-[190px]">
          <SelectValue placeholder="Property">{propertyLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Properties</SelectItem>
          <SelectItem value={HQ_SHARED_ID}>HQ / Shared</SelectItem>
          {properties.map((property) => (
            <SelectItem key={property.id} value={property.id}>
              {property.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.category}
        onValueChange={(v) =>
          onChange({ ...filters, category: v as ExpenseCategory | "all" })
        }
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Category">{categoryLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORY_OPTIONS.map((category) => (
            <SelectItem key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(v) =>
          onChange({ ...filters, status: v as ExpenseStatus | "all" })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status">{statusLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
