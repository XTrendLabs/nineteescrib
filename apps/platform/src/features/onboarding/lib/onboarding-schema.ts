import { propertyTypeValues } from "@propertyos/db/schema/property";
import z from "zod";

export const profileStepSchema = z.object({
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters"),
  title: z.string().min(1, "Select your role"),
  phoneNumber: z
    .string()
    .min(8, "Enter a valid phone number")
    .regex(/^\+?[0-9\s-]+$/, "Enter a valid phone number"),
});

export type ProfileStepValues = z.infer<typeof profileStepSchema>;

export const otpStepSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
});

export type OtpStepValues = z.infer<typeof otpStepSchema>;

export const propertyStepSchema = z.object({
  name: z.string().min(2, "Property name must be at least 2 characters"),
  propertyType: z.enum(propertyTypeValues),
  addressLine1: z.string().min(2, "Enter an address"),
  city: z.string().min(1, "Enter a city"),
  state: z.string().min(1, "Enter a state"),
  country: z.string().min(1, "Enter a country"),
});

export type PropertyStepValues = z.infer<typeof propertyStepSchema>;

export const memberTitles = [
  "Owner",
  "Property Manager",
  "Staff",
  "Other",
] as const;
