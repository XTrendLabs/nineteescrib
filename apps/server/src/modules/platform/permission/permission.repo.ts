import { createDb } from "@propertyos/db";
import { member, organization } from "@propertyos/db/schema/organization";
import { room } from "@propertyos/db/schema/room";
import { staff } from "@propertyos/db/schema/staff";
import { and, eq, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const db = createDb();

export const permissionRepo = {
  /**
   * The caller's scope, from the active organization on their session.
   *
   * The session already names the organization the user is working in, so
   * there is nothing to resolve from the request: one lookup on a known id
   * yields both the organization's kind and the caller's role in it.
   */
  async findActiveScope(organizationId: string, userId: string) {
    const [row] = await db
      .select({
        id: organization.id,
        kind: organization.kind,
        parentOrganizationId: organization.parentOrganizationId,
        role: member.role,
      })
      .from(organization)
      .innerJoin(
        member,
        and(
          eq(member.organizationId, organization.id),
          eq(member.userId, userId),
        ),
      )
      .where(eq(organization.id, organizationId))
      .limit(1);

    if (!row) return undefined;

    return {
      role: row.role,
      organization: {
        id: row.id,
        kind: row.kind,
        parentOrganizationId: row.parentOrganizationId,
      },
    };
  },

  /** True when `organizationId` is a property sitting under `hqId`. */
  async isChildOf(organizationId: string, hqId: string) {
    const [row] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(
        and(
          eq(organization.id, organizationId),
          eq(organization.parentOrganizationId, hqId),
        ),
      )
      .limit(1);
    return Boolean(row);
  },

  /** The organization (property) a room belongs to. */
  async findOrganizationIdByRoom(roomId: string) {
    const [row] = await db
      .select({ organizationId: room.organizationId })
      .from(room)
      .where(eq(room.id, roomId))
      .limit(1);
    return row?.organizationId;
  },

  /** The HQ a staff member is hired at. */
  async findOrganizationIdByStaff(staffId: string) {
    const [row] = await db
      .select({ organizationId: staff.hqOrganizationId })
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1);
    return row?.organizationId;
  },

  async findIdBySlug(slug: string) {
    const [row] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1);
    return row?.id;
  },

  /**
   * Access to a property organization is granted either by direct membership
   * in it, or by membership in the HQ organization above it -- that is what
   * lets an owner reach every property without being added to each one.
   */
  /**
   * Resolves the target organization and the caller's membership in ONE query.
   *
   * Each round-trip to the database costs 100-400ms, so this deliberately
   * trades a slightly larger query for three fewer network hops: the
   * organization is looked up by id or slug, and the membership join covers
   * both the property itself and the HQ above it.
   */
  async findAccess(
    target: { organizationId?: string; slug?: string },
    userId: string,
  ) {
    if (!target.organizationId && !target.slug) return undefined;

    const parent = alias(organization, "parent");

    const [row] = await db
      .select({
        id: organization.id,
        kind: organization.kind,
        parentOrganizationId: organization.parentOrganizationId,
        role: member.role,
        memberOrganizationId: member.organizationId,
      })
      .from(organization)
      .leftJoin(parent, eq(parent.id, organization.parentOrganizationId))
      .innerJoin(
        member,
        and(
          eq(member.userId, userId),
          or(
            eq(member.organizationId, organization.id),
            eq(member.organizationId, parent.id),
          ),
        ),
      )
      .where(
        target.organizationId
          ? eq(organization.id, target.organizationId)
          : eq(organization.slug, target.slug as string),
      )
      // Prefer a direct membership over one inherited from the HQ, so `role`
      // and `viaHq` describe the strongest rights the caller actually holds.
      .orderBy(
        sql`case when ${member.organizationId} = ${organization.id} then 0 else 1 end`,
      )
      .limit(1);

    if (!row) return undefined;

    return {
      role: row.role,
      // True when the caller's rights come from the HQ rather than from
      // being a member of the property itself.
      viaHq: row.memberOrganizationId !== row.id,
      organization: {
        id: row.id,
        kind: row.kind,
        parentOrganizationId: row.parentOrganizationId,
      },
    };
  },
};
