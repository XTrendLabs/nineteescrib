import z from "zod";

/**
 * Optional email that tolerates a blank field.
 *
 * The form submits untouched inputs as empty strings, and clearing an address
 * is a legitimate edit -- so "" has to pass validation and reach the server,
 * which normalizes it to an absent value.
 */
const optionalEmail = z
  .string()
  .trim()
  .refine(
    (value) =>
      value.length === 0 || z.string().email().safeParse(value).success,
    { message: "Enter a valid email" },
  );

const optionalText = z.string().trim().max(200, "That is too long");

export const companyProfileFormSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  displayName: optionalText,

  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  state: optionalText,
  country: optionalText,
  pin: optionalText,

  pan: optionalText,
  gstin: optionalText,
  cin: optionalText,

  businessEmail: optionalEmail,
  businessPhone: optionalText,
  supportEmail: optionalEmail,
  website: optionalText,
});

export type CompanyProfileFormValues = z.infer<typeof companyProfileFormSchema>;

/** Every editable field, blank. Also the shape the form resets to. */
export const EMPTY_COMPANY_PROFILE: CompanyProfileFormValues = {
  companyName: "",
  displayName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  pin: "",
  pan: "",
  gstin: "",
  cin: "",
  businessEmail: "",
  businessPhone: "",
  supportEmail: "",
  website: "",
};
