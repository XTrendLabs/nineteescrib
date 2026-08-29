import { auth } from "@propertyos/auth";

import { AppError } from "../../../core";
import { storageService } from "../storage/storage.service";
import { generateUniquePropertySlug, propertyRepo } from "./property.repo";

export const propertyService = {
  list(hqOrganizationId: string) {
    return propertyRepo.listByHq(hqOrganizationId);
  },

  /** Used at property scope, where the list is just the active property. */
  listSelf(organizationId: string) {
    return propertyRepo.listSelf(organizationId);
  },

  /** Properties the user may switch into; see `propertyRepo.listAccessible`. */
  listAccessible(userId: string) {
    return propertyRepo.listAccessible(userId);
  },

  findBySlug(slug: string) {
    return propertyRepo.findBySlug(slug);
  },

  /**
   * A property is an organization, so it is created through Better Auth --
   * that is what grants the caller an owner membership on it -- and then given
   * its hospitality details row.
   */
  async create(
    input: {
      hqOrganizationId?: string;
      name: string;
      propertyType?: string;
      addressLine1?: string;
      city?: string;
      state?: string;
      country?: string;
    },
    headers: Headers,
  ) {
    const { hqOrganizationId, name, ...details } = input;
    const slug = await generateUniquePropertySlug(name);

    const created = await auth.api.createOrganization({
      body: {
        name,
        slug,
        kind: "property",
        parentOrganizationId: hqOrganizationId,
      },
      headers,
    });

    if (!created) {
      throw AppError.validation("Could not create the property organization");
    }

    await propertyRepo.createDetails({
      organizationId: created.id,
      ...details,
    });

    return { propertyId: created.id, slug };
  },

  updateBusinessDetails(
    propertyId: string,
    input: {
      ownerName: string;
      contactPhone: string;
      contactEmail: string;
      whatsappNumber: string;
      operationsOpenTime: string;
      operationsCloseTime: string;
    },
  ) {
    return propertyRepo.updateBusinessDetails(propertyId, input);
  },

  updatePropertyDetails(
    propertyId: string,
    input: {
      name: string;
      propertyType: string;
      addressLine1?: string;
      city?: string;
      state?: string;
      country?: string;
    },
  ) {
    return propertyRepo.updatePropertyDetails(propertyId, input);
  },

  updateTaxDetails(
    propertyId: string,
    input: {
      gstNumber?: string;
      panNumber?: string;
      invoicePrefix?: string;
      billingAddress?: string;
      bankAccountHolderName?: string;
      bankAccountNumber?: string;
      bankIfscCode?: string;
      bankName?: string;
    },
  ) {
    return propertyRepo.updateTaxDetails(propertyId, input);
  },

  updatePolicies(
    propertyId: string,
    input: {
      checkInTime: string;
      checkOutTime: string;
      minStayNights?: number;
      maxStayNights?: number;
    },
  ) {
    return propertyRepo.updatePolicies(propertyId, input);
  },

  listRules(propertyId: string) {
    return propertyRepo.listRules(propertyId);
  },

  upsertRule(propertyId: string, input: { category: string; content: string }) {
    return propertyRepo.upsertRule(propertyId, input);
  },

  removeRule(propertyId: string, category: string) {
    return propertyRepo.removeRule(propertyId, category);
  },

  async updateCoverImage(propertyId: string, file: File) {
    const existing = await propertyRepo.findById(propertyId);
    if (!existing) return undefined;

    const { url } = await storageService.uploadImage(file, [
      "properties",
      propertyId,
      "cover",
    ]);

    if (existing.coverImage) {
      await storageService.deleteByUrl(existing.coverImage);
    }

    return propertyRepo.updateCoverImage(propertyId, url);
  },
};
