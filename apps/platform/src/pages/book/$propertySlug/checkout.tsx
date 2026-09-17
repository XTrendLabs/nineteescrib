import { Button } from "@propertyos/ui/components/button";
import { Input } from "@propertyos/ui/components/input";
import { Label } from "@propertyos/ui/components/label";
import { PhoneInput } from "@propertyos/ui/components/phone-input";
import { Textarea } from "@propertyos/ui/components/textarea";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ShieldCheckIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { z } from "zod";

import {
  useCreatePublicBooking,
  usePublicAvailability,
} from "@/features/booking-engine/api/use-public-booking";
import { isBookingEngineEnabled } from "@/features/booking-engine/lib/feature-flag";
import { formatInr } from "@/features/booking-engine/lib/format";
import { roomTypeLabel } from "@/features/calendar/lib/calendar";
import { getApiErrorMessage } from "@/shared/lib/api-error";

const searchSchema = z.object({
  roomId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number(),
});

export const Route = createFileRoute("/book/$propertySlug/checkout")({
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
  const { propertySlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const feedback = useFeedback();

  const createBooking = useCreatePublicBooking();

  // Re-priced here rather than carried in the URL: a total in the query string
  // is a total the guest can edit, and this is the step that takes the money.
  const { data: availability, isLoading } = usePublicAvailability({
    slug: propertySlug,
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    guests: search.guests,
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const room = availability?.data?.rooms.find((r) => r.id === search.roomId);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  // The room was free when it was picked and is not now, or never existed.
  if (!room) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm">This room is no longer available.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            navigate({
              to: "/book/$propertySlug",
              params: { propertySlug },
              search: {
                checkIn: search.checkIn,
                checkOut: search.checkOut,
                guests: search.guests,
              },
            })
          }
        >
          Pick another room
        </Button>
      </div>
    );
  }

  const canSubmit =
    fullName.trim().length > 0 &&
    phone.trim().length > 0 &&
    !createBooking.isPending;

  function handlePay() {
    createBooking.mutate(
      {
        param: { slug: propertySlug },
        json: {
          roomId: search.roomId,
          checkIn: search.checkIn,
          checkOut: search.checkOut,
          guestCount: search.guests,
          guest: {
            name: fullName.trim(),
            phone: phone.trim(),
            email: email.trim() || undefined,
          },
          specialRequests: specialRequests.trim() || undefined,
        },
      },
      {
        onSuccess: (response) => {
          const created = response.data;
          if (!created) return;
          navigate({
            to: "/book/$propertySlug/confirmed",
            params: { propertySlug },
            search: {
              reference: created.ref,
              checkIn: created.checkIn,
              checkOut: created.checkOut,
              guestName: fullName.trim(),
              roomName: created.roomName,
              totalPaise: created.totalAmountPaise,
            },
          });
        },
        onError: (error) => {
          feedback.error(
            "Couldn't complete your booking",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          );
        },
      },
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
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
        <div className="flex flex-col gap-4 border p-4">
          <p className="font-medium text-sm">Guest Details</p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone Number (WhatsApp) *</Label>
            <PhoneInput
              id="phone"
              value={phone}
              onChange={(value) => setPhone(value ?? "")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="requests">Special Requests</Label>
            <Textarea
              id="requests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Optional"
              rows={3}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room</span>
              <span>
                {room.name} · {roomTypeLabel(room.roomType)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dates</span>
              <span>
                {format(parseDay(search.checkIn), "MMM d")} –{" "}
                {format(parseDay(search.checkOut), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guests</span>
              <span>{search.guests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nights</span>
              <span>{room.nights}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-medium">
              <span>Total</span>
              <span>{formatInr(room.totalPaise)}</span>
            </div>
          </div>

          {/* Said plainly rather than dressed up as a gateway: no money moves
              here yet, and the booking is recorded unpaid so the balance the
              property sees is the truth. */}
          <p className="border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
            Payment is simulated while the gateway is being set up. Your booking
            is confirmed and the balance is collected at the property.
          </p>

          <Button size="lg" disabled={!canSubmit} onClick={handlePay}>
            {createBooking.isPending
              ? "Confirming…"
              : `Confirm Booking · ${formatInr(room.totalPaise)}`}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
