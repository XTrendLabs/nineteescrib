import { vendorCategoryValues } from "@propertyos/db/schema/vendor";
import z from "zod";

/**
 * Optional free-text field.
 *
 * The dialog submits untouched inputs as empty strings rather than omitting
 * them, so "" is normalized to undefined here -- otherwise clearing a phone
 * number would store an empty string that reads as a value everywhere
 * downstream.
 */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

/** Fields shared by create and update. */
const vendorFields = {
  name: z.string().trim().min(1, "Vendor name is required"),
  category: z.enum(vendorCategoryValues),
  contactPerson: optionalText,
  phone: optionalText,
  // Not `.email()`: the field is optional and the empty string is already
  // normalized away above, so a blank input must not fail validation.
  email: optionalText.refine(
    (value) =>
      value === undefined || z.string().email().safeParse(value).success,
    { message: "Enter a valid email" },
  ),
  gstin: optionalText,
  address: optionalText,
  notes: optionalText,
};

/**
 * The HQ a vendor belongs to is not accepted from the client: it is derived
 * from the caller's active organization, so a request cannot file a vendor
 * under an HQ the caller does not work under.
 */
export const createVendorSchema = z.object(vendorFields);

export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const updateVendorSchema = z.object(vendorFields);

export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
