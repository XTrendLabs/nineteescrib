import { Button } from "@propertyos/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo } from "react";

import { BookingHeader } from "@/features/booking-engine/components/booking-header";
import {
  formatDateShort,
  formatInr,
} from "@/features/booking-engine/lib/format";
import {
  calculatePricing,
  findPropertyBySlugPath,
  resolveQuoteOffer,
} from "@/features/booking-engine/lib/mock-data";

export const Route = createFileRoute("/quote/$token")({
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useParams();
  const navigate = useNavigate();

  const offer = useMemo(() => resolveQuoteOffer(token), [token]);
  const property = useMemo(
    () => (offer ? findPropertyBySlugPath(offer.propertySlugPath) : undefined),
    [offer],
  );
  const roomType = property?.roomTypes.find(
    (rt) => rt.id === offer?.roomTypeId,
  );

  if (!offer || !property || !roomType) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm">This offer link is invalid or has expired.</p>
      </div>
    );
  }

  const basePricing = calculatePricing({
    roomType,
    property,
    checkIn: offer.checkIn,
    checkOut: offer.checkOut,
    guests: offer.guests,
    coupon: null,
  });
  const discountedTotalPaise = Math.round(
    basePricing.totalPaise * (1 - offer.discountPercent / 100),
  );

  const [tenantSlug, propertySlug] = offer.propertySlugPath.split("/");

  const handleConfirm = () => {
    navigate({
      to: "/book/$slug/$propertySlug/checkout",
      params: { slug: tenantSlug ?? "", propertySlug: propertySlug ?? "" },
      search: {
        roomTypeId: roomType.id,
        checkIn: offer.checkIn.toISOString().slice(0, 10),
        checkOut: offer.checkOut.toISOString().slice(0, 10),
        guests: offer.guests,
        promoCode: undefined,
      },
    });
  };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <BookingHeader property={property} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4 sm:p-8"
      >
        <div className="border bg-muted/30 p-4 text-center">
          <p className="font-medium text-sm">
            Special Offer for {offer.guestName} — {offer.discountPercent}%
            Direct Discount Applied
          </p>
        </div>

        <div className="flex flex-col gap-2 border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Property</span>
            <span>{property.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Room Type</span>
            <span>{roomType.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dates</span>
            <span>
              {formatDateShort(offer.checkIn)} –{" "}
              {formatDateShort(offer.checkOut)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Guests</span>
            <span>{offer.guests}</span>
          </div>
          <div className="flex justify-between text-muted-foreground text-xs line-through">
            <span>Standard Rate</span>
            <span>{formatInr(basePricing.totalPaise)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Special Rate</span>
            <span>{formatInr(discountedTotalPaise)}</span>
          </div>
        </div>

        <Button size="lg" onClick={handleConfirm}>
          Pay {formatInr(discountedTotalPaise)} to Confirm Offer →
        </Button>
      </motion.div>
    </div>
  );
}
