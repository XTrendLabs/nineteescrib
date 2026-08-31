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

export function PropertyFilter({
  properties,
  value,
  onChange,
}: {
  properties: MockProperty[];
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedLabel =
    value === "all"
      ? "All properties"
      : (properties.find((property) => property.id === value)?.name ??
        "All properties");

  return (
    <Select value={value} onValueChange={(next) => onChange(next as string)}>
      <SelectTrigger className="w-56">
        <SelectValue>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All properties</SelectItem>
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
