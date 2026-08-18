import { Badge } from "@propertyos/ui/components/badge";

import type { PropertyType } from "../lib/mock-data";

const TYPE_CONFIG: Record<
  PropertyType,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  hotel: { label: "Hotel", variant: "default" },
  villa: { label: "Villa", variant: "muted" },
  apartment: { label: "Apartment", variant: "outline" },
  homestay: { label: "Homestay", variant: "warning" },
  hostel: { label: "Hostel", variant: "secondary" },
};

export function TypeBadge({ type }: { type: PropertyType }) {
  const config = TYPE_CONFIG[type];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
