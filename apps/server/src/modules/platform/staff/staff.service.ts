import { staffRepo } from "./staff.repo";
import type { CreateStaffInput, UpdateStaffInput } from "./staff.schema";

export const staffService = {
  listByHqOrganization(hqOrganizationId: string) {
    return staffRepo.listByHqOrganization(hqOrganizationId);
  },

  findById(id: string) {
    return staffRepo.findById(id);
  },

  create(input: CreateStaffInput) {
    return staffRepo.create(input);
  },

  update(id: string, input: UpdateStaffInput) {
    return staffRepo.update(id, input);
  },

  remove(id: string) {
    return staffRepo.remove(id);
  },
};
