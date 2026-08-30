import { Badge } from "@propertyos/ui/components/badge";
import { GlobeIcon, HomeIcon, UserIcon, ZapIcon } from "lucide-react";

import type { BookingSource } from "../lib/booking";

const SOURCE_CONFIG: Record<
  BookingSource,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  direct: { label: "Direct", icon: GlobeIcon },
  manual: { label: "Manual", icon: UserIcon },
  airbnb: { label: "Airbnb", icon: HomeIcon },
  booking_com: { label: "Booking.com", icon: ZapIcon },
};

export function SourceBadge({ source }: { source: BookingSource }) {
  const config = SOURCE_CONFIG[source];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
