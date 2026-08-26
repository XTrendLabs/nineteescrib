import { PhoneIcon } from "lucide-react";

import type { PropertyDetail } from "@/features/properties/lib/mock-data";

export function BookingHeader({ property }: { property: PropertyDetail }) {
  return (
    <header
      className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-8"
      style={{ borderBottomColor: `${property.bookingLink.accentColor}22` }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex size-8 items-center justify-center font-display font-semibold text-sm text-white"
          style={{ backgroundColor: property.bookingLink.accentColor }}
        >
          {property.name.slice(0, 1)}
        </div>
        <span className="font-medium text-sm">{property.name}</span>
      </div>
      <a
        href="tel:+918322456789"
        className="flex items-center gap-1.5 text-muted-foreground text-xs hover:text-foreground"
      >
        <PhoneIcon className="size-3.5" />
        +91 832 2456789
      </a>
    </header>
  );
}
