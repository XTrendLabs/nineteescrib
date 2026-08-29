import { isValidPhoneNumber } from "react-phone-number-input";
import z from "zod";

import { staffGenderValues, staffRoleValues, staffStatusValues } from "./staff";

export const staffFormSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .refine(isValidPhoneNumber, "Enter a valid phone number"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
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
    /** Give this staff member a login for the platform. */
    platformAccess: z.boolean(),
    password: z.string(),
  })
  .refine((data) => !data.platformAccess || data.password.length >= 8, {
    path: ["password"],
    message: "Password must be at least 8 characters",
  });

/** What lives in form state. */
export type StaffFormValues = z.input<typeof staffFormSchema>;
/** What the API receives. */
export type StaffFormOutput = z.output<typeof staffFormSchema>;
