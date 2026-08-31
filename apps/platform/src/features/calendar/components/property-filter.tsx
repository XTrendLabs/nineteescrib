import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";

import type { BookingProperty as MockProperty } from "@/features/bookings/lib/property";

/**
 * Which property's rooms the calendar draws.
 *
 * There is no "all properties" option: the grid draws a row per room, and
 * stacking every property's inventory into one timeline scrolls past what
 * anyone can read. Inside a single property there is nothing to choose, so
 * the control renders as a plain label rather than a select with one entry.
 */
export function PropertyFilter({
  properties,
  value,
  onChange,
  locked,
}: {
  properties: MockProperty[];
  value: string;
  onChange: (value: string) => void;
  /** Scoped to one property, so the choice is not the user's to make. */
  locked?: boolean;
}) {
  const selected = properties.find((property) => property.id === value);

  if (locked) {
    return (
      <span className="flex h-9 items-center border px-2.5 text-xs">
        {selected?.name ?? "This property"}
      </span>
    );
  }

  return (
    <Select value={value} onValueChange={(next) => onChange(next as string)}>
      <SelectTrigger className="w-56">
        <SelectValue>{selected?.name ?? "Select property"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectGroupLabel>Properties</SelectGroupLabel>
          {properties.map((property) => (
            <SelectItem key={property.id} value={property.id}>
              {property.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
