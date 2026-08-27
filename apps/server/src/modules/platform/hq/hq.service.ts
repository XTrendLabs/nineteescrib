import { AppError } from "../../../core";
import { permissionRepo } from "../permission/permission.repo";
import { hqRepo } from "./hq.repo";

export const hqService = {
  listForUser(userId: string) {
    return hqRepo.listForUser(userId);
  },

  async listProperties(hqOrganizationId: string, userId: string) {
    const access = await permissionRepo.findAccess(
      { organizationId: hqOrganizationId },
      userId,
    );
    if (!access) {
      throw AppError.forbidden("You do not have access to this HQ");
    }

    return hqRepo.listProperties(hqOrganizationId);
  },
};
