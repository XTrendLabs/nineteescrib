import {
  staffGenderValues,
  staffRoleValues,
  staffStatusValues,
} from "@propertyos/db/schema/staff";
import z from "zod";

const optionalText = z.string().optional();

/** Fields shared by create and update — everything but the org binding. */
const staffFields = {
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(staffRoleValues),
  status: z.enum(staffStatusValues).optional(),
  dateOfBirth: optionalText,
  gender: z.enum(staffGenderValues).optional(),
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  state: optionalText,
  pinCode: optionalText,
  emergencyName: optionalText,
  emergencyPhone: optionalText,
  propertyIds: z.array(z.string()).optional(),
};

export const createStaffSchema = z.object({
  hqOrganizationId: z.string().min(1),
  ...staffFields,
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object(staffFields);

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
