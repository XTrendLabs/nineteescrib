import { AppError } from "../../../core";
import { settingsRepo } from "./settings.repo";
import type { UpdateCompanyProfileInput } from "./settings.schema";

/**
 * The company profile as the settings form needs it.
 *
 * `slug` and the fallback for `companyName` come from the organization itself
 * rather than the profile row, so an organization that has never saved a
 * profile still opens the form showing its real name instead of a blank field.
 */
export type CompanyProfile = {
  companyName: string;
  displayName: string;
  slug: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  pan: string;
  gstin: string;
  cin: string;
  businessEmail: string;
  businessPhone: string;
  supportEmail: string;
  website: string;
};

/**
 * Nulls become empty strings on the way out.
 *
 * Every field on this form is a controlled text input, and React warns and
 * switches an input to uncontrolled when its value flips between null and a
 * string -- so the absence of a value is normalized once here rather than at
 * sixteen call sites in the form.
 */
function text(value: string | null | undefined) {
  return value ?? "";
}

export const settingsService = {
  async getCompanyProfile(organizationId: string): Promise<CompanyProfile> {
    const [identity, profile] = await Promise.all([
      settingsRepo.findOrganizationIdentity(organizationId),
      settingsRepo.findProfileByOrganization(organizationId),
    ]);

    if (!identity) {
      throw AppError.notFound("Workspace not found");
    }

    return {
      // Falls back to the organization's own name so a profile that was never
      // filled in still opens showing the business it belongs to.
      companyName: text(profile?.companyName) || identity.name,
      displayName: text(profile?.displayName),
      slug: identity.slug,
      addressLine1: text(profile?.addressLine1),
      addressLine2: text(profile?.addressLine2),
      city: text(profile?.city),
      state: text(profile?.state),
      country: text(profile?.country),
      pin: text(profile?.pin),
      pan: text(profile?.pan),
      gstin: text(profile?.gstin),
      cin: text(profile?.cin),
      businessEmail: text(profile?.businessEmail),
      businessPhone: text(profile?.businessPhone),
      supportEmail: text(profile?.supportEmail),
      website: text(profile?.website),
    };
  },

  async updateCompanyProfile(
    organizationId: string,
    input: UpdateCompanyProfileInput,
  ): Promise<CompanyProfile> {
    await settingsRepo.upsertProfile(organizationId, input);
    return settingsService.getCompanyProfile(organizationId);
  },
};
