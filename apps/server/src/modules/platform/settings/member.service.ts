import type { AppRole } from "@propertyos/auth/permissions";

import { AppError } from "../../../core";
import { memberRepo } from "./member.repo";

/**
 * Role precedence, strongest first.
 *
 * Someone can hold different roles in different properties -- a manager at one
 * and staff at another. The directory shows one row per person, so it shows
 * the most access they have anywhere rather than an arbitrary pick.
 */
const ROLE_RANK: Record<string, number> = {
  owner: 3,
  "property-manager": 2,
  staff: 1,
};

function rank(role: string) {
  return ROLE_RANK[role] ?? 0;
}

export type WorkspaceMember = {
  /** The member row for the person's strongest membership. */
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  title: string | null;
  /** When they first joined any organization in the workspace. */
  joinedAt: Date;
  /** True when they hold an HQ membership, which is what makes an owner. */
  isOwner: boolean;
  /** The properties they can reach, for showing what their access covers. */
  organizations: { id: string; name: string; kind: string; role: string }[];
};

export const memberService = {
  /**
   * Everyone with platform access to the workspace.
   *
   * Collapsed to one row per person: a `member` row exists per organization,
   * so an owner across an HQ and three properties would otherwise appear four
   * times. Each person keeps their strongest role and earliest join date.
   */
  async list(hqOrganizationId: string): Promise<WorkspaceMember[]> {
    const rows = await memberRepo.listByScope(hqOrganizationId);

    const byUser = new Map<string, WorkspaceMember>();

    for (const row of rows) {
      const existing = byUser.get(row.userId);
      const organization = {
        id: row.organizationId,
        name: row.organizationName,
        kind: row.organizationKind,
        role: row.role,
      };

      if (!existing) {
        byUser.set(row.userId, {
          id: row.memberId,
          userId: row.userId,
          name: row.name,
          email: row.email,
          image: row.image ?? null,
          role: row.role,
          title: row.title ?? null,
          joinedAt: row.createdAt,
          isOwner: row.organizationKind === "hq",
          organizations: [organization],
        });
        continue;
      }

      existing.organizations.push(organization);
      // An HQ membership is what makes someone an owner, whichever row it
      // arrives on.
      if (row.organizationKind === "hq") existing.isOwner = true;
      if (rank(row.role) > rank(existing.role)) {
        existing.role = row.role;
        // Keep the id pointing at the membership the role came from, so an
        // action taken on this row targets the right one.
        existing.id = row.memberId;
      }
      // Rows arrive oldest-first, so the first sighting is the earliest join.
      if (row.createdAt < existing.joinedAt) existing.joinedAt = row.createdAt;
      if (!existing.title && row.title) existing.title = row.title;
    }

    // Owners first, then by how long they have been there.
    return [...byUser.values()].sort((a, b) => {
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      return a.joinedAt.getTime() - b.joinedAt.getTime();
    });
  },

  listInvitations(hqOrganizationId: string) {
    return memberRepo.listInvitationsByScope(hqOrganizationId);
  },

  /**
   * Changes what one person may do, across every property they belong to.
   *
   * Applied workspace-wide rather than per property: the directory presents
   * one role per person, so a change made there has to mean the same thing
   * everywhere -- otherwise demoting someone would silently leave their
   * manager access intact at another property.
   */
  async updateRole(
    memberId: string,
    hqOrganizationId: string,
    role: AppRole,
    actingUserId: string,
  ) {
    const target = await memberRepo.findMemberById(memberId);
    if (!target) {
      throw AppError.notFound("Member not found");
    }

    if (target.userId === actingUserId) {
      throw AppError.validation("You cannot change your own role");
    }

    await memberService.assertNotLastOwner(target.userId, hqOrganizationId, {
      demotingTo: role,
    });

    const updated = await memberRepo.updateRoleInScope(
      target.userId,
      hqOrganizationId,
      role,
    );
    if (updated.length === 0) {
      throw AppError.notFound("Member not found in this workspace");
    }

    return memberService.list(hqOrganizationId);
  },

  /**
   * Revokes access to the whole workspace.
   *
   * Every membership goes, not just the one in the active organization --
   * leaving the others would let the person sign in and still reach the rest
   * of the properties.
   */
  async remove(
    memberId: string,
    hqOrganizationId: string,
    actingUserId: string,
  ) {
    const target = await memberRepo.findMemberById(memberId);
    if (!target) {
      throw AppError.notFound("Member not found");
    }

    if (target.userId === actingUserId) {
      throw AppError.validation(
        "You cannot remove yourself from the workspace",
      );
    }

    await memberService.assertNotLastOwner(target.userId, hqOrganizationId);

    const removed = await memberRepo.removeFromScope(
      target.userId,
      hqOrganizationId,
    );
    if (removed.length === 0) {
      throw AppError.notFound("Member not found in this workspace");
    }

    return memberService.list(hqOrganizationId);
  },

  /**
   * Refuses a change that would leave the workspace with no owner.
   *
   * Without this, removing or demoting the last owner locks everyone out of
   * billing and of the organization's own settings, with no way back through
   * the app.
   */
  async assertNotLastOwner(
    userId: string,
    hqOrganizationId: string,
    options?: { demotingTo?: AppRole },
  ) {
    // A change that keeps them an owner cannot reduce the owner count.
    if (options?.demotingTo === "owner") return;

    const memberships = await memberRepo.findMembershipsInScope(
      userId,
      hqOrganizationId,
    );
    const isOwner = memberships.some(
      (row) => row.kind === "hq" && row.role === "owner",
    );
    if (!isOwner) return;

    const owners = await memberRepo.countOwners(hqOrganizationId);
    if (owners <= 1) {
      throw AppError.validation(
        "This is the only owner. Make someone else an owner first.",
      );
    }
  },

  /**
   * Cancels a pending invitation.
   *
   * The invitation must belong to this workspace: ids are guessable and the
   * route param is attacker-controlled, so it is checked against the scope the
   * session establishes rather than trusting the client to send back only ids
   * it was given.
   */
  async revokeInvitation(invitationId: string, hqOrganizationId: string) {
    const found = await memberRepo.findInvitationById(invitationId);
    if (!found) {
      throw AppError.notFound("Invitation not found");
    }

    const inScope = await memberRepo.isOrganizationInScope(
      found.organizationId,
      hqOrganizationId,
    );
    if (!inScope) {
      throw AppError.forbidden("That is outside your current workspace");
    }

    await memberRepo.revokeInvitation(invitationId);
    return memberService.listInvitations(hqOrganizationId);
  },
};
