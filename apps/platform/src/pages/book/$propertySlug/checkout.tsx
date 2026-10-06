import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import { Label } from "@propertyos/ui/components/label";
import { PhoneInput } from "@propertyos/ui/components/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { Textarea } from "@propertyos/ui/components/textarea";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ShieldCheckIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { ModeToggle } from "@/components/mode-toggle";
import {
  useCreatePublicBooking,
  usePublicAvailability,
} from "@/features/booking-engine/api/use-public-booking";
import { BookingStepper } from "@/features/booking-engine/components/booking-stepper";
import { bookingExtraLabel } from "@/features/booking-engine/lib/booking-options";
import { isBookingEngineEnabled } from "@/features/booking-engine/lib/feature-flag";
import { formatInr } from "@/features/booking-engine/lib/format";
import { roomTypeLabel } from "@/features/calendar/lib/calendar";
import { honoClient } from "@/shared/lib/api-client";
import { getApiErrorMessage } from "@/shared/lib/api-error";

const searchSchema = z.object({
  roomId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number(),
  extras: z.array(z.string()).optional(),
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

async function uploadIdProof(propertySlug: string, file: File) {
  const response = await honoClient.api.public.properties[":slug"][
    "id-proof"
  ].$post({ param: { slug: propertySlug }, form: { file } } as unknown as {
    param: { slug: string };
    form: { file: File };
  });

  if (!response.ok) {
    throw new Error("ID proof upload failed");
  }

  const body = await response.json();
  if (!body.data?.url) {
    throw new Error("ID proof upload did not return an image URL");
  }

  return body.data.url;
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
  const [idProofType, setIdProofType] = useState("");
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [bookingPurpose, setBookingPurpose] = useState("");
  const [bookingPurposeCustom, setBookingPurposeCustom] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isUploadingIdProof, setIsUploadingIdProof] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [step, setStep] = useState<2 | 3>(2);

  const idProofPreviewUrl = useMemo(
    () => (idProofFile ? URL.createObjectURL(idProofFile) : null),
    [idProofFile],
  );

  useEffect(() => {
    return () => {
      if (idProofPreviewUrl) URL.revokeObjectURL(idProofPreviewUrl);
    };
  }, [idProofPreviewUrl]);

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

  const canContinue =
    fullName.trim().length > 0 &&
    phone.trim().length > 0 &&
    idProofType.length > 0 &&
    idProofFile !== null &&
    bookingPurpose.length > 0 &&
    (bookingPurpose !== "custom" || bookingPurposeCustom.trim().length > 0) &&
    !createBooking.isPending;

  async function handlePay() {
    if (!idProofFile) return;

    setIsUploadingIdProof(true);

    try {
      const idProofUrl = await uploadIdProof(propertySlug, idProofFile);
      const response = await createBooking.mutateAsync({
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
          idProofType: idProofType as
            | "aadhaar"
            | "voter_id"
            | "driving_license"
            | "passport"
            | "overseas_id",
          idProofUrl,
          bookingPurpose: bookingPurpose as
            | "leisure"
            | "business"
            | "medical"
            | "event"
            | "other"
            | "custom",
          bookingPurposeCustom:
            bookingPurpose === "custom"
              ? bookingPurposeCustom.trim()
              : undefined,
          extras: search.extras,
          specialRequests: specialRequests.trim() || undefined,
        },
      });

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
    } catch (error) {
      feedback.error(
        "Couldn't complete your booking",
        getApiErrorMessage(error, "Something went wrong. Try again."),
      );
    } finally {
      setIsUploadingIdProof(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-8">
        <h1 className="text-display-sm">Complete Your Reservation</h1>
        <div className="flex items-center gap-3">
          <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <ShieldCheckIcon className="size-3.5" />
            256-bit SSL Secure
          </p>
          <ModeToggle />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="flex flex-col gap-6 p-4 sm:px-8"
      >
        <BookingStepper activeStep={step} />

        {step === 2 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                <Label htmlFor="bookingPurpose">Booking Purpose *</Label>
                <Select
                  value={bookingPurpose}
                  onValueChange={(value) => setBookingPurpose(value as string)}
                >
                  <SelectTrigger id="bookingPurpose">
                    <SelectValue placeholder="Select booking purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leisure">Leisure / Holiday</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="event">Event / Wedding</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {bookingPurpose === "custom" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bookingPurposeCustom">
                    Custom Booking Purpose *
                  </Label>
                  <Input
                    id="bookingPurposeCustom"
                    value={bookingPurposeCustom}
                    onChange={(e) => setBookingPurposeCustom(e.target.value)}
                    placeholder="Enter booking purpose"
                    maxLength={120}
                  />
                </div>
              )}
              <Button
                size="lg"
                disabled={!canContinue}
                onClick={() => setStep(3)}
              >
                Continue to review
              </Button>
            </div>

            <div className="flex flex-col gap-4 border p-4">
              <p className="font-medium text-sm">ID Proof</p>
              <p className="text-muted-foreground text-xs">
                Upload a clear image of the document you will present at
                check-in.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="idProofType">ID Proof Type *</Label>
                <Select
                  value={idProofType}
                  onValueChange={(value) => setIdProofType(value as string)}
                >
                  <SelectTrigger id="idProofType">
                    <SelectValue placeholder="Select ID proof type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                    <SelectItem value="voter_id">Voter ID</SelectItem>
                    <SelectItem value="driving_license">
                      Driving Licence
                    </SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="overseas_id">
                      Overseas ID Card (international guest)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="idProofFile">Upload ID Proof *</Label>
                <Input
                  id="idProofFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(event) =>
                    setIdProofFile(event.target.files?.[0] ?? null)
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  JPG, PNG, WEBP or AVIF · maximum 10 MB
                </p>
                {idProofFile && (
                  <p className="text-[11px] text-muted-foreground">
                    Selected: {idProofFile.name}
                  </p>
                )}
              </div>
              {idProofPreviewUrl && (
                <div className="flex flex-col gap-2">
                  <p className="font-medium text-xs">Preview</p>
                  <div className="flex h-48 items-center justify-center overflow-hidden border bg-muted/20 p-2">
                    <img
                      src={idProofPreviewUrl}
                      alt="Preview of uploaded ID proof"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
              <button
                type="button"
                className="w-fit text-left text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={() => setPrivacyOpen(true)}
              >
                How we store and use your ID proof
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3 border p-4 text-sm">
              <p className="font-medium">Review Booking</p>
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
                <span className="text-muted-foreground">Guest</span>
                <span>
                  {fullName} · {phone}
                </span>
              </div>
              {email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID proof</span>
                <span>{idProofType.replaceAll("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purpose</span>
                <span>
                  {bookingPurpose === "custom"
                    ? bookingPurposeCustom
                    : bookingPurpose}
                </span>
              </div>
              {search.extras && search.extras.length > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Extras</span>
                  <span className="text-right">
                    {search.extras.map(bookingExtraLabel).join(", ")}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1.5 border-t pt-3">
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
                  <span className="text-muted-foreground">Nights</span>
                  <span>{room.nights}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>Total</span>
                  <span>{formatInr(room.totalPaise)}</span>
                </div>
              </div>
              <p className="border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
                Payment is simulated while the gateway is being set up. Your
                booking is confirmed and the balance is collected at the
                property.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button size="lg" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button size="lg" disabled={!canContinue} onClick={handlePay}>
                  {isUploadingIdProof
                    ? "Uploading ID proof…"
                    : createBooking.isPending
                      ? "Confirming…"
                      : `Confirm Booking · ${formatInr(room.totalPaise)}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ID proof privacy notice</DialogTitle>
            <DialogDescription>
              Please review how this document is handled before continuing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-4 pb-4 text-muted-foreground text-xs leading-relaxed">
            <p>
              We collect this image only to verify the guest identity for this
              booking and to support check-in and applicable accommodation
              records. We do not use it for advertising or profiling.
            </p>
            <p>
              The image is uploaded to secured object storage and linked to this
              booking. Access is restricted to authorised property staff who
              need it for booking operations and verification.
            </p>
            <p>
              The property retains the document only for as long as needed for
              the booking, safety, accounting, dispute, and legal obligations
              that apply to the stay. Retention and deletion requests are
              handled subject to those obligations.
            </p>
            <p>
              You may ask the property for access, correction, or deletion of
              your personal data where applicable. For questions or requests,
              contact the property using the booking contact details.
            </p>
            <p className="text-[11px]">
              This notice is provided for this booking flow and should be
              aligned with the property’s published privacy policy and legal
              review before production launch.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
