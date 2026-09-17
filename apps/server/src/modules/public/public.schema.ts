import z from "zod";

/** Calendar days, as everywhere else -- see the booking schema. */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date");

const hasPositiveDuration = (value: { checkIn: string; checkOut: string }) =>
  value.checkOut > value.checkIn;

const DURATION_ERROR = {
  message: "Check-out must be after check-in",
  path: ["checkOut"] as PropertyKey[],
};

export const publicAvailabilityQuerySchema = z
  .object({
    checkIn: dateString,
    checkOut: dateString,
    guests: z.coerce.number().int().positive().optional(),
  })
  .refine(hasPositiveDuration, DURATION_ERROR);

/** The window the public calendar shades, a month or two at a time. */
export const publicOccupancyQuerySchema = z
  .object({
    from: dateString,
    to: dateString,
  })
  .refine((value) => value.to > value.from, {
    message: "The window must end after it starts",
    path: ["to"] as PropertyKey[],
  });

/**
 * A booking made by a guest on the public site.
 *
 * The price is deliberately absent: it is computed on the server from the
 * room's own rates. Taking it from the request would let anyone book a suite
 * for a rupee by editing the payload.
 */
export const publicBookingSchema = z
  .object({
    roomId: z.string().min(1, "Pick a room"),
    checkIn: dateString,
    checkOut: dateString,
    guestCount: z.number().int().positive().default(1),
    guest: z.object({
      name: z.string().min(1, "Your name is required"),
      phone: z.string().min(1, "A phone number is required"),
      email: z
        .string()
        .email("Enter a valid email")
        .optional()
        .or(z.literal("")),
    }),
    arrivalTime: z.string().max(60).optional(),
    specialRequests: z.string().max(2000).optional(),
  })
  .refine(hasPositiveDuration, DURATION_ERROR);

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
