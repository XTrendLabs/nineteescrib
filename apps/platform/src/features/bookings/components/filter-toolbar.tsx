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

import type { MockProperty } from "../lib/mock-data";

export type BookingFilters = {
  search: string;
  propertyId: string;
  status: string;
  source: string;
};

export const DEFAULT_FILTERS: BookingFilters = {
  search: "",
  propertyId: "all",
  status: "all",
  source: "all",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "pending", label: "Pending" },
  { value: "checked_out", label: "Checked Out" },
  { value: "cancelled", label: "Cancelled" },
];

const SOURCE_OPTIONS = [
  { value: "all", label: "All sources" },
  { value: "direct", label: "Direct" },
  { value: "manual", label: "Manual" },
  { value: "airbnb", label: "Airbnb" },
  { value: "booking_com", label: "Booking.com" },
];

export function FilterToolbar({
  properties,
  filters,
  onChange,
}: {
  properties: MockProperty[];
  filters: BookingFilters;
  onChange: (filters: BookingFilters) => void;
}) {
  const isFiltered =
    filters.search !== "" ||
    filters.propertyId !== "all" ||
    filters.status !== "all" ||
    filters.source !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search guest, phone, or booking ref..."
          className="pl-8"
        />
      </div>

      <Select
        value={filters.propertyId}
        onValueChange={(value) =>
          onChange({ ...filters, propertyId: value as string })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Property">
            {(value: unknown) =>
              value === "all"
                ? "All properties"
                : (properties.find((p) => p.id === value)?.name ?? "Property")
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All properties</SelectItem>
          {properties.map((property) => (
            <SelectItem key={property.id} value={property.id}>
              {property.name}
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
        <SelectTrigger className="w-40">
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

      <Select
        value={filters.source}
        onValueChange={(value) =>
          onChange({ ...filters, source: value as string })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Source">
            {(value: unknown) =>
              SOURCE_OPTIONS.find((o) => o.value === value)?.label ?? "Source"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SOURCE_OPTIONS.map((option) => (
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
