import z from "zod";

import { roomStatusValues, roomTypeValues } from "./room";

export const roomFormSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  roomNumber: z.string().optional(),
  floor: z.string().optional(),
  roomType: z.enum(roomTypeValues),
  status: z.enum(roomStatusValues),
  weekdayPrice: z.coerce.number().int().nonnegative(),
  weekendPrice: z.coerce.number().int().nonnegative(),
  maxGuests: z.coerce.number().int().positive(),
  amenityIds: z.array(z.string()),
});

/** What lives in form state — number inputs hand back strings. */
export type RoomFormValues = z.input<typeof roomFormSchema>;
/** What the API receives, after coercion. */
export type RoomFormOutput = z.output<typeof roomFormSchema>;
