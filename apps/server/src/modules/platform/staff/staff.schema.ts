import {
  staffGenderValues,
  staffRoleValues,
  staffStatusValues,
} from "@propertyos/db/schema/staff";
import z from "zod";

const optionalText = z.string().optional();

/** Matches Better Auth's default minimum. */
export const MIN_PASSWORD = 8;

/** Fields shared by create and update — everything but the org binding. */
const detailFields = {
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
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
};

/** Create still takes assignments inline, since there is no record to patch yet. */
const staffFields = {
  ...detailFields,
  propertyIds: z.array(z.string()).optional(),
};

export const createStaffSchema = z
  .object({
    hqOrganizationId: z.string().min(1),
    ...staffFields,
    /** Create a login account for this staff member. */
    platformAccess: z.boolean().optional(),
    password: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.platformAccess || (data.password?.length ?? 0) >= MIN_PASSWORD,
    {
      path: ["password"],
      message: `Password must be at least ${MIN_PASSWORD} characters`,
    },
  );

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

/**
 * Detail edits only. Property assignments move through their own endpoint:
 * they cost a membership reconcile that a name or phone change should not pay
 * for.
 */
export const updateStaffSchema = z.object(detailFields);

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

export const updateStaffPropertiesSchema = z.object({
  propertyIds: z.array(z.string()),
});

export type UpdateStaffPropertiesInput = z.infer<
  typeof updateStaffPropertiesSchema
>;
