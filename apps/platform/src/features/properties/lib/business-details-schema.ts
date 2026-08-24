import { isValidPhoneNumber } from "react-phone-number-input";
import z from "zod";

export const businessDetailsSchema = z.object({
  ownerName: z.string().min(1, "Owner name is required"),
  contactPhone: z
    .string()
    .min(1, "Contact phone is required")
    .refine(isValidPhoneNumber, { message: "Enter a valid phone number" }),
  contactEmail: z.email("Enter a valid email"),
  whatsappNumber: z
    .string()
    .min(1, "WhatsApp number is required")
    .refine(isValidPhoneNumber, { message: "Enter a valid phone number" }),
  operationsOpenTime: z.string().min(1, "Opening time is required"),
  operationsCloseTime: z.string().min(1, "Closing time is required"),
});

export type BusinessDetailsValues = z.infer<typeof businessDetailsSchema>;
