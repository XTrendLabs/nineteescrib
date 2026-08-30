import { Badge } from "@propertyos/ui/components/badge";

import type { BookingStatus } from "../lib/booking";

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  confirmed: { label: "Confirmed", variant: "success" },
  checked_in: { label: "Checked In", variant: "solid-success" },
  pending: { label: "Pending", variant: "warning" },
  checked_out: { label: "Checked Out", variant: "muted" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export function StatusPill({ status }: { status: BookingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className="rounded-full">
      {config.label}
    </Badge>
  );
}
