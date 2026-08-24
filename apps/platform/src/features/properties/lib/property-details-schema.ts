import z from "zod";

export const propertyDetailsTypeValues = [
  "villa",
  "apartment",
  "hotel",
  "homestay",
  "other",
] as const;

export const propertyDetailsSchema = z.object({
  name: z.string().min(2, "Property name must be at least 2 characters"),
  propertyType: z.enum(propertyDetailsTypeValues),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

export type PropertyDetailsValues = z.infer<typeof propertyDetailsSchema>;
