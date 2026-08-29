import { auth } from "@propertyos/auth";
import type { AppRole } from "@propertyos/auth/permissions";

import { AppError } from "../../../core";
import { staffRepo } from "./staff.repo";
import type { CreateStaffInput, UpdateStaffInput } from "./staff.schema";

/** Staff roles map onto the organization roles that gate the API. */
const ORGANIZATION_ROLE = {
  admin: "property-manager",
  manager: "property-manager",
  caretaker: "staff",
  housekeeping: "staff",
} as const satisfies Record<string, AppRole>;

export const staffService = {
  listByHqOrganization(hqOrganizationId: string, viewerUserId?: string) {
    return staffRepo.listByHqOrganization(hqOrganizationId, viewerUserId);
  },

  listByProperty(organizationId: string, viewerUserId?: string) {
    return staffRepo.listByProperty(organizationId, viewerUserId);
  },

  findIdByUserId(userId: string) {
    return staffRepo.findIdByUserId(userId);
  },

  findById(id: string) {
    return staffRepo.findById(id);
  },

  /**
   * Creates the staff record, and -- when platform access is requested -- a
   * login account for them plus membership of each property they are assigned
   * to, so the existing permission checks apply to them unchanged.
   */
  async create(input: CreateStaffInput) {
    const { platformAccess, password, ...staffInput } = input;

    if (!platformAccess) {
      return staffRepo.create(staffInput);
    }

    if (!password) {
      throw AppError.validation("A password is required for platform access");
    }

    const existing = await staffRepo.findUserByEmail(staffInput.email);
    if (existing) {
      throw AppError.conflict("An account with this email already exists");
    }

    const signUp = await auth.api.signUpEmail({
      body: {
        email: staffInput.email,
        password,
        name: staffInput.fullName,
      },
    });

    if (!signUp?.user) {
      throw AppError.validation("Could not create the login account");
    }

    const role: AppRole =
      ORGANIZATION_ROLE[staffInput.role as keyof typeof ORGANIZATION_ROLE] ??
      "staff";

    // These are independent writes against a database ~300ms away, so they run
    // together rather than one after another.
    await Promise.all([
      // The account was created by an owner who already knows this address, so
      // there is no address to prove -- leaving it unverified would block a
      // staff member who never asked to sign up.
      staffRepo.markEmailVerified(signUp.user.id),
      // Membership is granted per property, so the staff member sees only the
      // properties they are assigned to -- not the whole HQ.
      ...(staffInput.propertyIds ?? []).map((organizationId) =>
        auth.api.addMember({
          body: { userId: signUp.user.id, organizationId, role },
        }),
      ),
    ]);

    return staffRepo.create({ ...staffInput, userId: signUp.user.id });
  },

  /**
   * Detail edits only -- one UPDATE, no membership work. Assignments move
   * through `setProperties`, so changing a phone number does not pay for a
   * membership reconcile.
   */
  async update(id: string, input: UpdateStaffInput) {
    const updated = await staffRepo.update(id, input);
    return updated?.staff;
  },

  /**
   * Property assignments live in two places: `staffProperty` (the HR record)
   * and organization membership (what actually grants access). Both have to
   * move together, or the staff member keeps seeing the old set of properties
   * in their switcher.
   */
  async setProperties(id: string, propertyIds: string[]) {
    const staffRecord = await staffRepo.findForAssignment(id);
    if (!staffRecord) return undefined;

    // `staff.userId` is the link to the login account, but a record can predate
    // that column or have been created before platform access existed. Fall
    // back to the email so assignments still reconcile, and repair the link.
    let userId = staffRecord.userId;
    if (!userId && staffRecord.email) {
      const existing = await staffRepo.findUserByEmail(staffRecord.email);
      if (existing) {
        userId = existing.id;
        await staffRepo.linkUser(id, userId);
      }
    }

    const properties = await staffRepo.replaceProperties(id, propertyIds);

    // No login means nothing to grant -- the HR record is the whole story.
    if (!userId) return properties;

    const role: AppRole =
      ORGANIZATION_ROLE[staffRecord.role as keyof typeof ORGANIZATION_ROLE] ??
      "staff";

    await staffRepo.syncMemberships(userId, propertyIds, role);

    return properties;
  },

  remove(id: string) {
    return staffRepo.remove(id);
  },
};
