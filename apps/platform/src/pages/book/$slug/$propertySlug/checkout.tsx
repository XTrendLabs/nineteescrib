import { Button } from "@propertyos/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheckIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { z } from "zod";

import { BookingHeader } from "@/features/booking-engine/components/booking-header";
import {
  CheckoutForm,
  type GuestDetailsFormValue,
} from "@/features/booking-engine/components/checkout-form";
import { HoldTimer } from "@/features/booking-engine/components/hold-timer";
import { ReservationSummary } from "@/features/booking-engine/components/reservation-summary";
import {
  calculatePricing,
  findPropertyBySlug,
  generateReservationReference,
  resolveCoupon,
} from "@/features/booking-engine/lib/mock-data";

const searchSchema = z.object({
  roomTypeId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number(),
  promoCode: z.string().optional(),
});

export const Route = createFileRoute("/book/$slug/$propertySlug/checkout")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const { slug, propertySlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const property = useMemo(
    () => findPropertyBySlug(slug, propertySlug),
    [slug, propertySlug],
  );
  const roomType = property?.roomTypes.find(
    (rt) => rt.id === search.roomTypeId,
  );

  const checkIn = new Date(search.checkIn);
  const checkOut = new Date(search.checkOut);
  const coupon = search.promoCode ? resolveCoupon(search.promoCode) : null;

  const [form, setForm] = useState<GuestDetailsFormValue>({
    fullName: "",
    phone: "",
    email: "",
    arrivalTime: "",
    specialRequests: "",
    gstin: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);

  if (!property || !roomType) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm">This room selection is no longer available.</p>
      </div>
    );
  }

  const pricing = calculatePricing({
    roomType,
    property,
    checkIn,
    checkOut,
    guests: search.guests,
    coupon,
  });

  const canSubmit =
    form.fullName.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.email.trim().length > 0 &&
    !expired;

  const handlePay = () => {
    setSubmitting(true);
    const reference = generateReservationReference();
    navigate({
      to: "/book/$slug/$propertySlug/confirmed",
      params: { slug, propertySlug },
      search: {
        reference,
        roomTypeId: roomType.id,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        guestName: form.fullName,
        guestPhone: form.phone,
        guestEmail: form.email,
        totalPaise: pricing.totalPaise,
      },
    });
  };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <BookingHeader property={property} />

      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-8">
        <h1 className="text-display-sm">Complete Your Reservation</h1>
        <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <ShieldCheckIcon className="size-3.5" />
          256-bit SSL Secure
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="grid grid-cols-1 gap-6 p-4 sm:px-8 lg:grid-cols-2"
      >
        <div className="border p-4">
          <CheckoutForm value={form} onChange={setForm} />
        </div>

        <div className="flex flex-col gap-3">
          <ReservationSummary
            property={property}
            roomType={roomType}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={search.guests}
            pricing={pricing}
            couponCode={coupon?.code ?? null}
          />

          {expired ? (
            <p className="text-center text-destructive text-xs">
              Your hold has expired. Please go back and reselect your room.
            </p>
          ) : (
            <HoldTimer onExpire={() => setExpired(true)} />
          )}

          <Button
            size="lg"
            disabled={!canSubmit || submitting}
            onClick={handlePay}
          >
            {submitting
              ? "Processing…"
              : `Pay ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(pricing.totalPaise / 100)} & Confirm Booking →`}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Razorpay / UPI / GPay / PhonePe / Card
          </p>
        </div>
      </motion.div>
    </div>
  );
}
