import { createDb } from "@propertyos/db";
import { vendor } from "@propertyos/db/schema/vendor";
import { desc, eq } from "drizzle-orm";

const db = createDb();

export const vendorRepo = {
  listByHqOrganization(hqOrganizationId: string) {
    return db
      .select()
      .from(vendor)
      .where(eq(vendor.hqOrganizationId, hqOrganizationId))
      .orderBy(desc(vendor.createdAt));
  },

  async findById(id: string) {
    const [row] = await db
      .select()
      .from(vendor)
      .where(eq(vendor.id, id))
      .limit(1);
    return row;
  },

  /**
   * The HQ a vendor belongs to, for the scope check. Selected on its own so
   * authorizing a request does not have to read the whole row.
   */
  async findHqOrganizationId(id: string) {
    const [row] = await db
      .select({ hqOrganizationId: vendor.hqOrganizationId })
      .from(vendor)
      .where(eq(vendor.id, id))
      .limit(1);
    return row?.hqOrganizationId;
  },

  async create(input: Omit<typeof vendor.$inferInsert, "id">) {
    const [row] = await db
      .insert(vendor)
      .values({ ...input, id: crypto.randomUUID() })
      .returning();
    return row;
  },

  async update(id: string, input: Partial<typeof vendor.$inferInsert>) {
    const [row] = await db
      .update(vendor)
      .set(input)
      .where(eq(vendor.id, id))
      .returning();
    return row;
  },

  async remove(id: string) {
    const [row] = await db.delete(vendor).where(eq(vendor.id, id)).returning();
    return row;
  },
};
