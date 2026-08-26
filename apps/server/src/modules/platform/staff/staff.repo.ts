import { createDb } from "@propertyos/db";
import { organization } from "@propertyos/db/schema/organization";
import { staff, staffProperty } from "@propertyos/db/schema/staff";
import { desc, eq, inArray } from "drizzle-orm";

const db = createDb();

type StaffRow = typeof staff.$inferSelect;

/** Fold each member's property assignments in, in one extra query. */
async function attachProperties(rows: StaffRow[]) {
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

  return rows.map((row) => ({
    ...row,
    properties: links
      .filter((l) => l.staffId === row.id)
      .map((l) => ({ id: l.organizationId, name: l.name, slug: l.slug })),
  }));
}

async function replaceProperties(staffId: string, propertyIds: string[]) {
  await db.delete(staffProperty).where(eq(staffProperty.staffId, staffId));
  if (propertyIds.length > 0) {
    await db
      .insert(staffProperty)
      .values(
        propertyIds.map((organizationId) => ({ staffId, organizationId })),
      );
  }
}

export const staffRepo = {
  async listByHqOrganization(hqOrganizationId: string) {
    const rows = await db
      .select()
      .from(staff)
      .where(eq(staff.hqOrganizationId, hqOrganizationId))
      .orderBy(desc(staff.createdAt));
    return attachProperties(rows);
  },

  async findById(id: string) {
    const [row] = await db
      .select()
      .from(staff)
      .where(eq(staff.id, id))
      .limit(1);
    if (!row) return undefined;
    const [withProperties] = await attachProperties([row]);
    return withProperties;
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
      await replaceProperties(id, propertyIds);
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
    if (rows.length === 0) return undefined;

    if (propertyIds) {
      await replaceProperties(id, propertyIds);
    }

    return staffRepo.findById(id);
  },

  async remove(id: string) {
    const rows = await db.delete(staff).where(eq(staff.id, id)).returning();
    return rows[0];
  },
};
