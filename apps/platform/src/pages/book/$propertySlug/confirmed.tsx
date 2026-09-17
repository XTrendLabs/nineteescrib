import { createFileRoute, notFound } from "@tanstack/react-router";
import { format } from "date-fns";
import { PartyPopperIcon } from "lucide-react";
import { motion } from "motion/react";
import { z } from "zod";

import { isBookingEngineEnabled } from "@/features/booking-engine/lib/feature-flag";
import { formatInr } from "@/features/booking-engine/lib/format";

const searchSchema = z.object({
  reference: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guestName: z.string(),
  roomName: z.string(),
  totalPaise: z.number(),
});

export const Route = createFileRoute("/book/$propertySlug/confirmed")({
  // Off by default. A 404 rather than a notice: a page saying "not taking
  // bookings yet" tells a stranger the property exists and is not ready,
  // which is the operator's business, not theirs. While the engine is off
  // the route simply is not there.
  beforeLoad: () => {
    if (!isBookingEngineEnabled) throw notFound();
  },
  component: RouteComponent,
  validateSearch: searchSchema,
});

function parseDay(day: string) {
  return new Date(`${day}T00:00:00`);
}

function RouteComponent() {
  const search = Route.useSearch();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="flex w-full max-w-md flex-col gap-4"
      >
        <div className="flex flex-col items-center gap-2 border p-6 text-center">
          <PartyPopperIcon className="size-7 text-success" />
          <p className="font-medium text-sm">Booking confirmed</p>
          <p className="text-muted-foreground text-xs">
            {search.guestName}, your stay is held under{" "}
            <span className="font-medium text-foreground">
              {search.reference}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Room</span>
            <span>{search.roomName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Check in</span>
            <span>{format(parseDay(search.checkIn), "EEE, MMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Check out</span>
            <span>{format(parseDay(search.checkOut), "EEE, MMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Total</span>
            <span>{formatInr(search.totalPaise)}</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Payable at the property. Keep {search.reference} for your records.
        </p>
      </motion.div>
    </div>
  );
}
