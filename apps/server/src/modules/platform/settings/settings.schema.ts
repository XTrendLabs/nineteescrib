import z from "zod";

/**
 * Optional free-text field.
 *
 * The profile form submits untouched inputs as empty strings rather than
 * omitting them, so "" is normalized to null here -- clearing a GSTIN has to
 * store an absent value, not an empty string that reads as a value everywhere
 * downstream. Null rather than undefined because these are updates: undefined
 * would leave the existing value in place, which is the opposite of clearing.
 */
const optionalText = z
  .string()
  .trim()
  .max(200, "That is too long")
  .transform((value) => (value.length === 0 ? null : value))
  .nullish()
  .transform((value) => value ?? null);

/**
 * Optional email. Not `.email()` directly: the field is optional and the empty
 * string is already normalized away above, so a blank input must not fail
 * validation.
 */
const optionalEmail = optionalText.refine(
  (value) => value === null || z.string().email().safeParse(value).success,
  { message: "Enter a valid email" },
);

/**
 * The organization whose profile is being written is not accepted from the
 * client: it is derived from the caller's active organization, so a request
 * cannot edit the business identity of an organization the caller does not
 * belong to.
 *
 * `slug` is likewise absent -- it is the organization's own identifier, shown
 * read-only in the form, and renaming it would break every URL that carries it.
 */
export const updateCompanyProfileSchema = z.object({
  companyName: optionalText,
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

export type UpdateCompanyProfileInput = z.infer<
  typeof updateCompanyProfileSchema
>;

/**
 * The workspace the caller believes is active.
 *
 * Optional, and the empty string is normalized away: the client sends it as a
 * cache key and has no id to send until the session resolves one. Scope always
 * comes from the session regardless, so this only ever narrows -- it is what
 * lets a stale request be rejected rather than answered for the wrong
 * workspace.
 */
export const activeOrganizationQuerySchema = z.object({
  activeOrganizationId: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional(),
});
