import { Button } from "@propertyos/ui/components/button";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute } from "@tanstack/react-router";
import {
  DownloadIcon,
  MapPinIcon,
  MessageCircleIcon,
  PartyPopperIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { z } from "zod";

import {
  formatDateLong,
  formatInr,
} from "@/features/booking-engine/lib/format";
import { findPropertyBySlug } from "@/features/booking-engine/lib/mock-data";

const searchSchema = z.object({
  reference: z.string(),
  roomTypeId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guestName: z.string(),
  guestPhone: z.string(),
  guestEmail: z.string(),
  totalPaise: z.number(),
});

export const Route = createFileRoute("/book/$slug/$propertySlug/confirmed")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const { slug, propertySlug } = Route.useParams();
  const search = Route.useSearch();
  const feedback = useFeedback();

  const property = useMemo(
    () => findPropertyBySlug(slug, propertySlug),
    [slug, propertySlug],
  );
  const roomType = property?.roomTypes.find(
    (rt) => rt.id === search.roomTypeId,
  );

  if (!property || !roomType) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm">This confirmation could not be found.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh justify-center bg-muted/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="flex w-full max-w-lg flex-col gap-6 border bg-background p-5"
      >
        <div className="flex flex-col items-center gap-1 text-center">
          <PartyPopperIcon className="size-8 text-success" />
          <h1 className="text-display-sm">Booking Confirmed!</h1>
          <p className="text-muted-foreground text-xs">
            Reservation Reference: {search.reference}
          </p>
        </div>

        <p className="border-t pt-4 text-center text-sm">
          Thank you, {search.guestName.split(" ")[0]}! A confirmation message
          and receipt have been sent to your WhatsApp ({search.guestPhone}) and
          email ({search.guestEmail}).
        </p>

        <div className="flex flex-col gap-1 border-t pt-4 text-xs">
          <p className="mb-1 font-medium text-sm">Your Reservation Details</p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Property</span>
            <span>
              {property.name} — {property.city}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Room Type</span>
            <span>{roomType.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Check-in</span>
            <span>
              {formatDateLong(new Date(search.checkIn))} (after 2:00 PM)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Check-out</span>
            <span>
              {formatDateLong(new Date(search.checkOut))} (before 11:00 AM)
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total Amount Paid</span>
            <span>{formatInr(search.totalPaise)} (Paid in full)</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t pt-4 text-xs">
          <p className="mb-1 font-medium text-sm">Check-in &amp; Directions</p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Caretaker Name</span>
            <span>Sagar Patil</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Caretaker Phone</span>
            <span>+91 98765 43210</span>
          </div>
          <p className="text-muted-foreground">
            House Rules: No noise after 10 PM · ID required at check-in
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              feedback.success(
                "Directions opened",
                "Google Maps directions would open in a new tab.",
              )
            }
          >
            <MapPinIcon />
            Open Directions
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              feedback.success(
                "Receipt downloaded",
                "Your PDF tax invoice has been generated.",
              )
            }
          >
            <DownloadIcon />
            Download Tax Invoice
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              feedback.success(
                "WhatsApp opened",
                "A WhatsApp chat with the host would open.",
              )
            }
          >
            <MessageCircleIcon />
            Need Help?
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
