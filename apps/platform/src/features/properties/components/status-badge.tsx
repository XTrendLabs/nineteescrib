import { Badge } from "@propertyos/ui/components/badge";

import type { PropertyStatus } from "../lib/mock-data";

const STATUS_CONFIG: Record<
  PropertyStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "muted" },
  maintenance: { label: "Under Maintenance", variant: "warning" },
};

export function StatusBadge({ status }: { status: PropertyStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
