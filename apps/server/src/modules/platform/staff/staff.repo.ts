import { createDb } from "@propertyos/db";
import { user } from "@propertyos/db/schema/auth";
import { member, organization } from "@propertyos/db/schema/organization";
import { staff, staffProperty } from "@propertyos/db/schema/staff";
import { and, desc, eq, inArray } from "drizzle-orm";

const db = createDb();

type StaffRow = typeof staff.$inferSelect;

/**
 * Fold each member's property assignments in, in one extra query.
 *
 * `viewerUserId` marks the caller's own row. The login id itself stays
 * server-side -- the client only needs to know which record is theirs, so it
 * can show edit controls for that one and hide them for everyone else.
 */
async function attachProperties(rows: StaffRow[], viewerUserId?: string) {
  if (rows.length === 0) return [];

  const staffIds = rows.map((r) => r.id);
  const links = await db
    .select({
      staffId: staffProperty.staffId,
      organizationId: organization.id,
      name: organization.name,
      slug: organization.slug,
    })
    .from(staffProperty)
    .innerJoin(organization, eq(staffProperty.organizationId, organization.id))
    .where(inArray(staffProperty.staffId, staffIds));

  return rows.map(({ userId, ...row }) => ({
    ...row,
    // The login account id itself is internal; the UI only needs to know
    // whether one exists.
    hasPlatformAccess: userId !== null,
    isSelf: viewerUserId !== undefined && userId === viewerUserId,
    properties: links
      .filter((l) => l.staffId === row.id)
      .map((l) => ({ id: l.organizationId, name: l.name, slug: l.slug })),
  }));
}

/** The property assignments of one staff member, resolved to names. */
function listPropertiesFor(staffId: string) {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    })
    .from(staffProperty)
    .innerJoin(organization, eq(staffProperty.organizationId, organization.id))
    .where(eq(staffProperty.staffId, staffId));
}

/**
 * Swaps a staff member's assignments and returns the resulting set, so the
 * caller does not need a follow-up read to describe what it just wrote.
 */
async function replacePropertiesFor(staffId: string, propertyIds: string[]) {
  await db.delete(staffProperty).where(eq(staffProperty.staffId, staffId));
  if (propertyIds.length === 0) return [];

  await db
    .insert(staffProperty)
    .values(propertyIds.map((organizationId) => ({ staffId, organizationId })));

  return listPropertiesFor(staffId);
}

export const staffRepo = {
  markEmailVerified(userId: string) {
    return db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, userId));
  },

  async findUserByEmail(email: string) {
    const [row] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    return row;
  },

  async listByHqOrganization(hqOrganizationId: string, viewerUserId?: string) {
    const rows = await db
      .select()
      .from(staff)
      .where(eq(staff.hqOrganizationId, hqOrganizationId))
      .orderBy(desc(staff.createdAt));
    return attachProperties(rows, viewerUserId);
  },

  /**
   * The staff assigned to one property.
   *
   * Someone scoped to a single property -- a staff member, or a manager of
   * that property -- can only reach the roster they work alongside, not the
   * whole HQ.
   */
  async listByProperty(organizationId: string, viewerUserId?: string) {
    const rows = await db
      .select({ staff })
      .from(staff)
      .innerJoin(staffProperty, eq(staffProperty.staffId, staff.id))
      .where(eq(staffProperty.organizationId, organizationId))
      .orderBy(desc(staff.createdAt));
    return attachProperties(
      rows.map((r) => r.staff),
      viewerUserId,
    );
  },

  /**
   * The staff record belonging to a login, if there is one.
   *
   * Carries the HQ as well: a caller reading their own data should be scoped
   * by the record itself rather than by an organization id they supplied.
   */
  async findByUserId(userId: string) {
    const [row] = await db
      .select({ id: staff.id, hqOrganizationId: staff.hqOrganizationId })
      .from(staff)
      .where(eq(staff.userId, userId))
      .limit(1);
    return row;
  },

  replaceProperties: replacePropertiesFor,

  /** The fields `setProperties` needs to reconcile access, in one read. */
  async findForAssignment(id: string) {
    const [row] = await db
      .select({ userId: staff.userId, email: staff.email, role: staff.role })
      .from(staff)
      .where(eq(staff.id, id))
      .limit(1);
    return row;
  },

  /**
   * Points a login's property memberships at exactly `propertyIds`.
   *
   * Better Auth's `addMember` costs five round-trips per call (user lookup,
   * duplicate check, member count, org lookup, insert) and `removeMember`
   * needs a session. The rows are ours, the caller has already established the
   * user and the properties exist, so this writes them directly: two
   * round-trips regardless of how many properties changed.
   *
   * HQ memberships are left alone -- an HQ membership is what makes someone an
   * owner, and is not ours to revoke.
   */
  async syncMemberships(userId: string, propertyIds: string[], role: string) {
    // Which property memberships exist today. `member` has no unique index on
    // (user_id, organization_id), so the insert cannot lean on ON CONFLICT --
    // the set to add is worked out here instead.
    const existing = await db
      .select({
        organizationId: member.organizationId,
        kind: organization.kind,
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(eq(member.userId, userId));

    const keep = new Set(propertyIds);
    // HQ memberships are left alone -- an HQ membership is what makes someone
    // an owner, and is not ours to revoke.
    const properties = existing.filter((row) => row.kind !== "hq");
    const stale = properties
      .filter((row) => !keep.has(row.organizationId))
      .map((row) => row.organizationId);
    const held = new Set(properties.map((row) => row.organizationId));
    const missing = propertyIds.filter((id) => !held.has(id));

    await Promise.all([
      stale.length > 0
        ? db
            .delete(member)
            .where(
              and(
                eq(member.userId, userId),
                inArray(member.organizationId, stale),
              ),
            )
        : undefined,
      missing.length > 0
        ? db.insert(member).values(
            missing.map((organizationId) => ({
              id: crypto.randomUUID(),
              organizationId,
              userId,
              role,
              createdAt: new Date(),
            })),
          )
        : undefined,
    ]);
  },

  /** Records the login account a staff record belongs to. */
  async linkUser(id: string, userId: string) {
    await db.update(staff).set({ userId }).where(eq(staff.id, id));
  },

  /**
   * Organizations the given login is a member of, split by kind. Revoking
   * access must never touch an HQ membership -- that is what makes someone an
   * owner -- so the caller needs to tell the two apart.
   */
  async listMemberships(userId: string) {
    const rows = await db
      .select({
        organizationId: member.organizationId,
        kind: organization.kind,
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(eq(member.userId, userId));

    return {
      all: rows.map((r) => r.organizationId),
      properties: rows
        .filter((r) => r.kind !== "hq")
        .map((r) => r.organizationId),
    };
  },

  async findById(id: string) {
    // The id is already known, so the assignments do not have to wait for the
    // staff row to come back. Against a remote database each round-trip costs
    // ~300ms, so overlapping the two roughly halves this lookup.
    const [rows, links] = await Promise.all([
      db.select().from(staff).where(eq(staff.id, id)).limit(1),
      db
        .select({
          organizationId: organization.id,
          name: organization.name,
          slug: organization.slug,
        })
        .from(staffProperty)
        .innerJoin(
          organization,
          eq(staffProperty.organizationId, organization.id),
        )
        .where(eq(staffProperty.staffId, id)),
    ]);

    const row = rows[0];
    if (!row) return undefined;

    const { userId, ...rest } = row;
    return {
      ...rest,
      hasPlatformAccess: userId !== null,
      properties: links.map((l) => ({
        id: l.organizationId,
        name: l.name,
        slug: l.slug,
      })),
    };
  },

  async create(input: {
    hqOrganizationId: string;
    fullName: string;
    phone: string;
    propertyIds?: string[];
    [key: string]: unknown;
  }) {
    const id = crypto.randomUUID();
    const { propertyIds, ...staffInput } = input;

    await db
      .insert(staff)
      .values({ id, ...staffInput } as typeof staff.$inferInsert);

    if (propertyIds && propertyIds.length > 0) {
      await replacePropertiesFor(id, propertyIds);
    }

    return staffRepo.findById(id);
  },

  async update(
    id: string,
    input: { propertyIds?: string[]; [key: string]: unknown },
  ) {
    const { propertyIds, ...staffInput } = input;

    const rows = await db
      .update(staff)
      .set(staffInput as Partial<typeof staff.$inferInsert>)
      .where(eq(staff.id, id))
      .returning();

    const updated = rows[0];
    if (!updated) return undefined;

    // `returning()` already gave us the updated row, and the assignments are
    // whatever we just wrote -- re-reading both would be two more round-trips
    // to a database ~300ms away.
    const links = propertyIds
      ? await replacePropertiesFor(id, propertyIds)
      : await listPropertiesFor(id);

    const { userId, ...rest } = updated;
    return {
      staff: { ...rest, hasPlatformAccess: userId !== null, properties: links },
      // The service reconciles memberships against this; it stays out of the
      // response body.
      userId,
    };
  },

  async remove(id: string) {
    const rows = await db.delete(staff).where(eq(staff.id, id)).returning();
    return rows[0];
  },
};
