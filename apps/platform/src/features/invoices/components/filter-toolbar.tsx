import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { SearchIcon } from "lucide-react";
import {
  type InvoiceStatus,
  MOCK_PROPERTIES,
  STATUS_LABELS,
} from "../lib/mock-data";

export type DateRangeFilter = "all" | "last_7" | "last_30" | "this_month";

export const DATE_RANGE_LABELS: Record<DateRangeFilter, string> = {
  all: "All Time",
  last_7: "Last 7 Days",
  last_30: "Last 30 Days",
  this_month: "This Month",
};

export type InvoiceFilters = {
  search: string;
  propertyId: string | "all";
  status: InvoiceStatus | "all";
  dateRange: DateRangeFilter;
};

export const DEFAULT_INVOICE_FILTERS: InvoiceFilters = {
  search: "",
  propertyId: "all",
  status: "all",
  dateRange: "all",
};

const STATUS_OPTIONS: InvoiceStatus[] = [
  "draft",
  "sent",
  "partial",
  "paid",
  "overdue",
  "cancelled",
];

const DATE_RANGE_OPTIONS: DateRangeFilter[] = [
  "all",
  "last_7",
  "last_30",
  "this_month",
];

export function FilterToolbar({
  filters,
  onChange,
}: {
  filters: InvoiceFilters;
  onChange: (filters: InvoiceFilters) => void;
}) {
  const propertyLabel =
    filters.propertyId === "all"
      ? "All Properties"
      : (MOCK_PROPERTIES.find((p) => p.id === filters.propertyId)?.name ??
        "All Properties");

  const statusLabel =
    filters.status === "all" ? "All Statuses" : STATUS_LABELS[filters.status];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[240px] flex-1">
        <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search invoice #, guest, phone..."
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
          {MOCK_PROPERTIES.map((property) => (
            <SelectItem key={property.id} value={property.id}>
              {property.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(v) =>
          onChange({ ...filters, status: v as InvoiceStatus | "all" })
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

      <Select
        value={filters.dateRange}
        onValueChange={(v) =>
          onChange({ ...filters, dateRange: v as DateRangeFilter })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Date">
            {DATE_RANGE_LABELS[filters.dateRange]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGE_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {DATE_RANGE_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
