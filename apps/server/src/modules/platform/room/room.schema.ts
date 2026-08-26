import { roomStatusValues, roomTypeValues } from "@propertyos/db/schema/room";
import z from "zod";

export const createRoomSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1, "Room name is required"),
  roomNumber: z.string().optional(),
  floor: z.string().optional(),
  roomType: z.enum(roomTypeValues).optional(),
  status: z.enum(roomStatusValues).optional(),
  weekdayPrice: z.number().int().nonnegative().optional(),
  weekendPrice: z.number().int().nonnegative().optional(),
  maxGuests: z.number().int().positive().optional(),
  amenityIds: z.array(z.string()).optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  roomNumber: z.string().optional(),
  floor: z.string().optional(),
  roomType: z.enum(roomTypeValues),
  status: z.enum(roomStatusValues).optional(),
  weekdayPrice: z.number().int().nonnegative(),
  weekendPrice: z.number().int().nonnegative(),
  maxGuests: z.number().int().positive(),
  amenityIds: z.array(z.string()).optional(),
});

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
