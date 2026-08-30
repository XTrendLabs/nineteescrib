import { vendorRepo } from "./vendor.repo";
import type { CreateVendorInput, UpdateVendorInput } from "./vendor.schema";

export const vendorService = {
  list(hqOrganizationId: string) {
    return vendorRepo.listByHqOrganization(hqOrganizationId);
  },

  findById(id: string) {
    return vendorRepo.findById(id);
  },

  /** The HQ that owns a vendor, for the route-level scope check. */
  findHqOrganizationId(id: string) {
    return vendorRepo.findHqOrganizationId(id);
  },

  create(hqOrganizationId: string, input: CreateVendorInput) {
    return vendorRepo.create({ ...input, hqOrganizationId });
  },

  update(id: string, input: UpdateVendorInput) {
    return vendorRepo.update(id, input);
  },

  remove(id: string) {
    return vendorRepo.remove(id);
  },
};
