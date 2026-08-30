import {
  blockReasonValues,
  bookingKindValues,
  bookingPaymentMethodValues,
  bookingSourceValues,
  guestTagValues,
} from "@propertyos/db/schema/booking";
import z from "zod";

/**
 * Check-in and check-out are calendar days, so they travel as "YYYY-MM-DD"
 * strings rather than as datetimes. Sending an ISO instant instead would make
 * the stored day depend on the caller's timezone.
 */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date");

const paymentInput = z.object({
  amountPaise: z.number().int().positive("Payment must be more than zero"),
  method: z.enum(bookingPaymentMethodValues).optional(),
  paidAt: dateString,
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

/** A stay must run forwards: same-day check-in and check-out is not a stay. */
const hasPositiveDuration = (value: { checkIn: string; checkOut: string }) =>
  value.checkOut > value.checkIn;

const DURATION_ERROR = {
  message: "Check-out must be after check-in",
  path: ["checkOut"] as PropertyKey[],
};

export const createBookingSchema = z
  .object({
    propertyId: z.string().min(1),
    roomId: z.string().min(1, "Pick a room"),
    kind: z.enum(bookingKindValues).optional(),
    blockReason: z.enum(blockReasonValues).optional(),
    // Absent for a block, which occupies a room on nobody's behalf. The
    // service enforces the pairing, since which fields are required depends
    // on `kind`.
    guest: z
      .object({
        name: z.string().min(1, "Guest name is required"),
        phone: z.string().min(1, "Guest phone is required"),
        email: z
          .string()
          .email("Enter a valid email")
          .optional()
          .or(z.literal("")),
      })
      .optional(),
    source: z.enum(bookingSourceValues).optional(),
    checkIn: dateString,
    checkOut: dateString,
    guestCount: z.number().int().positive().optional(),
    totalAmountPaise: z.number().int().nonnegative().optional(),
    notes: z.string().optional(),
    /** Minutes to hold inventory; only meaningful when `kind` is "hold". */
    holdMinutes: z.number().int().positive().max(1440).optional(),
    initialPayment: paymentInput.optional(),
  })
  .refine(hasPositiveDuration, DURATION_ERROR);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingSchema = z
  .object({
    roomId: z.string().min(1).optional(),
    checkIn: dateString.optional(),
    checkOut: dateString.optional(),
    guestCount: z.number().int().positive().optional(),
    totalAmountPaise: z.number().int().nonnegative().optional(),
    source: z.enum(bookingSourceValues).optional(),
    blockReason: z.enum(blockReasonValues).optional(),
    notes: z.string().optional(),
    guest: z
      .object({
        name: z.string().min(1, "Guest name is required"),
        phone: z.string().min(1, "Guest phone is required"),
        email: z
          .string()
          .email("Enter a valid email")
          .optional()
          .or(z.literal("")),
      })
      .optional(),
  })
  // Dates are optional here, so the ordering rule only applies when both are
  // being changed; the service re-checks against the stored values otherwise.
  .refine(
    (value) =>
      value.checkIn === undefined ||
      value.checkOut === undefined ||
      value.checkOut > value.checkIn,
    DURATION_ERROR,
  );

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

/**
 * The status changes a member can ask for.
 *
 * "cancelled" is deliberately absent: cancelling carries a reason and is its
 * own endpoint, gated on the `cancel` permission rather than `update`.
 */
export const bookingTransitionValues = [
  "confirmed",
  "checked_in",
  "checked_out",
] as const;

export const changeStatusSchema = z.object({
  status: z.enum(bookingTransitionValues),
});

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export const recordPaymentSchema = paymentInput;

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const availabilityQuerySchema = z
  .object({
    propertyId: z.string().min(1),
    checkIn: dateString,
    checkOut: dateString,
    excludeBookingId: z.string().optional(),
  })
  .refine(hasPositiveDuration, DURATION_ERROR);

/**
 * A guest added straight to the directory, ahead of any booking.
 *
 * Same shape as an edit -- a guest is a person, not a stay, so there is
 * nothing extra to capture at creation time.
 */
export const createGuestSchema = z.object({
  name: z.string().min(1, "Guest name is required"),
  phone: z.string().min(1, "Guest phone is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  /** Becomes the first entry in the guest's note timeline, if given. */
  note: z.string().max(2000).optional(),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;

export const updateGuestSchema = z.object({
  name: z.string().min(1, "Guest name is required"),
  phone: z.string().min(1, "Guest phone is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;

/**
 * Only the tags a person applies by hand. "repeat" is absent by design: it is
 * derived from the stay count, so accepting it here would let a stored tag
 * contradict the bookings behind it.
 */
export const guestTagSchema = z.object({
  tag: z.enum(guestTagValues),
});

export type GuestTagInput = z.infer<typeof guestTagSchema>;

export const guestNoteSchema = z.object({
  text: z.string().min(1, "Write something first").max(2000),
});

export type GuestNoteInput = z.infer<typeof guestNoteSchema>;
