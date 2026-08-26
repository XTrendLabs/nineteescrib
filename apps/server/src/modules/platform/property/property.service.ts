import { storageService } from "../storage/storage.service";
import { propertyRepo } from "./property.repo";

export const propertyService = {
  list(organizationId: string) {
    return propertyRepo.listByOrganization(organizationId);
  },

  findBySlug(slug: string) {
    return propertyRepo.findBySlug(slug);
  },

  create(input: {
    organizationId: string;
    name: string;
    propertyType?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    country?: string;
  }) {
    return propertyRepo.create(input);
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
