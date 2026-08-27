import {
  propertyRuleCategoryValues,
  propertyTypeValues,
} from "@propertyos/db/schema/property";
import z from "zod";

// `.strict()` so a renamed or misspelled field is a loud 400 rather than a
// silently dropped key -- an omitted hqOrganizationId creates an orphaned
// property that no HQ can list.
export const createPropertySchema = z.strictObject({
  // Absent for a solo property that is not grouped under an HQ.
  hqOrganizationId: z.string().min(1).optional(),
  name: z.string().min(2, "Property name must be at least 2 characters"),
  propertyType: z.enum(propertyTypeValues).optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

export const updateBusinessDetailsSchema = z.object({
  ownerName: z.string().min(1, "Owner name is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactEmail: z.email("Enter a valid email"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  operationsOpenTime: z.string().min(1, "Opening time is required"),
  operationsCloseTime: z.string().min(1, "Closing time is required"),
});

export type UpdateBusinessDetailsInput = z.infer<
  typeof updateBusinessDetailsSchema
>;

export const updatePropertyDetailsSchema = z.object({
  name: z.string().min(2, "Property name must be at least 2 characters"),
  propertyType: z.enum(propertyTypeValues),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

export type UpdatePropertyDetailsInput = z.infer<
  typeof updatePropertyDetailsSchema
>;

export const updateTaxDetailsSchema = z.object({
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  invoicePrefix: z.string().optional(),
  billingAddress: z.string().optional(),
  bankAccountHolderName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankName: z.string().optional(),
});

export type UpdateTaxDetailsInput = z.infer<typeof updateTaxDetailsSchema>;

export const updatePoliciesSchema = z.object({
  checkInTime: z.string().min(1, "Check-in time is required"),
  checkOutTime: z.string().min(1, "Check-out time is required"),
  minStayNights: z.number().int().positive().optional(),
  maxStayNights: z.number().int().positive().optional(),
});

export type UpdatePoliciesInput = z.infer<typeof updatePoliciesSchema>;

export const upsertPropertyRuleSchema = z.object({
  category: z.enum(propertyRuleCategoryValues),
  content: z.string().min(1, "Rule content is required"),
});

export type UpsertPropertyRuleInput = z.infer<typeof upsertPropertyRuleSchema>;
