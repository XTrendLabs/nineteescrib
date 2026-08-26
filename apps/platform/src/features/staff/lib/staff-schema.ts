import z from "zod";

import { staffGenderValues, staffRoleValues, staffStatusValues } from "./staff";

export const staffFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[\d\s+()-]{7,}$/, "Enter a valid phone number"),
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]),
  role: z.enum(staffRoleValues),
  status: z.enum(staffStatusValues),
  dateOfBirth: z.string(),
  gender: z.enum(staffGenderValues).optional(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  city: z.string(),
  state: z.string(),
  pinCode: z.string(),
  emergencyName: z.string(),
  emergencyPhone: z.string(),
  propertyIds: z.array(z.string()),
});

/** What lives in form state. */
export type StaffFormValues = z.input<typeof staffFormSchema>;
/** What the API receives. */
export type StaffFormOutput = z.output<typeof staffFormSchema>;
