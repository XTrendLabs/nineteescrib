import { createDb } from "@propertyos/db";
import { user } from "@propertyos/db/schema/auth";
import {
  invitation,
  member,
  organization,
} from "@propertyos/db/schema/organization";
import { and, asc, eq, inArray, or } from "drizzle-orm";

const db = createDb();

/**
 * The organizations that make up one workspace: the HQ itself and every
 * property beneath it.
 *
 * Membership is granted per organization, and a staff member is only ever
 * added to the properties they work at -- never to the HQ. So "everyone with
 * access" is the union across the whole tree; reading the HQ's own member rows
 * would return the owners and nobody else.
 */
function scopeIds(hqOrganizationId: string) {
  return db
    .select({ id: organization.id })
    .from(organization)
    .where(
      or(
        eq(organization.id, hqOrganizationId),
        eq(organization.parentOrganizationId, hqOrganizationId),
      ),
    );
}

export const memberRepo = {
  /**
   * Everyone with access to the workspace, one row per person.
   *
   * A user holds one `member` row per organization they belong to, so an owner
   * with an HQ and three properties has four -- returning them raw would list
   * that person four times. The rows are collapsed per user here, keeping the
   * strongest role and the earliest join date, and gathering the organizations
   * each person can actually reach.
   */
  async listByScope(hqOrganizationId: string) {
    const rows = await db
      .select({
        memberId: member.id,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
        title: member.title,
        organizationId: organization.id,
        organizationName: organization.name,
        organizationKind: organization.kind,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .innerJoin(user, eq(user.id, member.userId))
      .where(inArray(member.organizationId, scopeIds(hqOrganizationId)))
      .orderBy(asc(member.createdAt));

    return rows;
  },

  /** Pending invitations across the workspace, newest first. */
  async listInvitationsByScope(hqOrganizationId: string) {
    return db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        organizationId: organization.id,
        organizationName: organization.name,
        inviterName: user.name,
      })
      .from(invitation)
      .innerJoin(organization, eq(organization.id, invitation.organizationId))
      .innerJoin(user, eq(user.id, invitation.inviterId))
      .where(
        and(
          inArray(invitation.organizationId, scopeIds(hqOrganizationId)),
          eq(invitation.status, "pending"),
        ),
      );
  },

  /**
   * Every membership one person holds inside the workspace.
   *
   * Removing access has to clear all of them -- deleting only the row for the
   * organization that happened to be active would leave the person still able
   * to sign in and see the other properties.
   */
  async findMembershipsInScope(userId: string, hqOrganizationId: string) {
    return db
      .select({
        id: member.id,
        organizationId: member.organizationId,
        kind: organization.kind,
        role: member.role,
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(
        and(
          eq(member.userId, userId),
          inArray(member.organizationId, scopeIds(hqOrganizationId)),
        ),
      );
  },

  /** The user behind a member row, for authorizing an operation on it. */
  async findMemberById(memberId: string) {
    const [row] = await db
      .select({
        id: member.id,
        userId: member.userId,
        organizationId: member.organizationId,
        role: member.role,
      })
      .from(member)
      .where(eq(member.id, memberId))
      .limit(1);
    return row;
  },

  /** How many people hold an HQ membership -- i.e. how many owners remain. */
  async countOwners(hqOrganizationId: string) {
    const rows = await db
      .select({ userId: member.userId })
      .from(member)
      .where(
        and(
          eq(member.organizationId, hqOrganizationId),
          eq(member.role, "owner"),
        ),
      );
    return rows.length;
  },

  /** Applies a role to every membership a person holds in the workspace. */
  async updateRoleInScope(
    userId: string,
    hqOrganizationId: string,
    role: string,
  ) {
    const memberships = await memberRepo.findMembershipsInScope(
      userId,
      hqOrganizationId,
    );
    if (memberships.length === 0) return [];

    return db
      .update(member)
      .set({ role })
      .where(
        inArray(
          member.id,
          memberships.map((row) => row.id),
        ),
      )
      .returning();
  },

  /** Revokes every membership a person holds in the workspace. */
  async removeFromScope(userId: string, hqOrganizationId: string) {
    const memberships = await memberRepo.findMembershipsInScope(
      userId,
      hqOrganizationId,
    );
    if (memberships.length === 0) return [];

    return db
      .delete(member)
      .where(
        inArray(
          member.id,
          memberships.map((row) => row.id),
        ),
      )
      .returning();
  },

  /** Whether an organization is the workspace's HQ or one of its properties. */
  async isOrganizationInScope(
    organizationId: string,
    hqOrganizationId: string,
  ) {
    const [row] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(
        and(
          eq(organization.id, organizationId),
          or(
            eq(organization.id, hqOrganizationId),
            eq(organization.parentOrganizationId, hqOrganizationId),
          ),
        ),
      )
      .limit(1);
    return Boolean(row);
  },

  async findInvitationById(invitationId: string) {
    const [row] = await db
      .select({
        id: invitation.id,
        organizationId: invitation.organizationId,
        email: invitation.email,
        status: invitation.status,
      })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);
    return row;
  },

  async revokeInvitation(invitationId: string) {
    const [row] = await db
      .update(invitation)
      .set({ status: "canceled" })
      .where(eq(invitation.id, invitationId))
      .returning();
    return row;
  },
};
