import { createDb } from "@propertyos/db";
import { property, propertyRule } from "@propertyos/db/schema/property";
import { and, eq } from "drizzle-orm";
import slugify from "slugify";

const db = createDb();

async function generateUniqueSlug(name: string) {
  const base = slugify(name, { lower: true, strict: true }) || "property";
  let slug = base;
  let suffix = 1;

  while (true) {
    const [existing] = await db
      .select({ id: property.id })
      .from(property)
      .where(eq(property.slug, slug))
      .limit(1);

    if (!existing) {
      return slug;
    }

    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

export const propertyRepo = {
  listByOrganization(organizationId: string) {
    return db
      .select({
        id: property.id,
        name: property.name,
        slug: property.slug,
        propertyType: property.propertyType,
        city: property.city,
        status: property.status,
      })
      .from(property)
      .where(eq(property.organizationId, organizationId))
      .orderBy(property.createdAt);
  },

  async findBySlug(slug: string) {
    const [result] = await db
      .select()
      .from(property)
      .where(eq(property.slug, slug))
      .limit(1);
    return result;
  },

  async findById(id: string) {
    const [result] = await db
      .select()
      .from(property)
      .where(eq(property.id, id))
      .limit(1);
    return result;
  },

  async updateCoverImage(propertyId: string, coverImage: string) {
    const rows = await db
      .update(property)
      .set({ coverImage })
      .where(eq(property.id, propertyId))
      .returning();
    const result: typeof property.$inferSelect | undefined = rows[0];
    return result;
  },

  async create(input: {
    organizationId: string;
    name: string;
    propertyType?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    country?: string;
  }) {
    const propertyId = crypto.randomUUID();
    const slug = await generateUniqueSlug(input.name);

    await db.insert(property).values({
      id: propertyId,
      slug,
      ...input,
    });

    return { propertyId, slug };
  },

  async updateBusinessDetails(
    propertyId: string,
    input: {
      ownerName: string;
      contactPhone: string;
      contactEmail: string;
      whatsappNumber: string;
      operationsOpenTime: string;
      operationsCloseTime: string;
    },
  ) {
    const rows = await db
      .update(property)
      .set(input)
      .where(eq(property.id, propertyId))
      .returning();
    const result: typeof property.$inferSelect | undefined = rows[0];
    return result;
  },

  async updatePropertyDetails(
    propertyId: string,
    input: {
      name: string;
      propertyType: string;
      addressLine1?: string;
      city?: string;
      state?: string;
      country?: string;
    },
  ) {
    const rows = await db
      .update(property)
      .set(input)
      .where(eq(property.id, propertyId))
      .returning();
    const result: typeof property.$inferSelect | undefined = rows[0];
    return result;
  },

  async updateTaxDetails(
    propertyId: string,
    input: {
      gstNumber?: string;
      panNumber?: string;
      invoicePrefix?: string;
      billingAddress?: string;
      bankAccountHolderName?: string;
      bankAccountNumber?: string;
      bankIfscCode?: string;
      bankName?: string;
    },
  ) {
    const rows = await db
      .update(property)
      .set(input)
      .where(eq(property.id, propertyId))
      .returning();
    const result: typeof property.$inferSelect | undefined = rows[0];
    return result;
  },

  async updatePolicies(
    propertyId: string,
    input: {
      checkInTime: string;
      checkOutTime: string;
      minStayNights?: number;
      maxStayNights?: number;
    },
  ) {
    const rows = await db
      .update(property)
      .set(input)
      .where(eq(property.id, propertyId))
      .returning();
    const result: typeof property.$inferSelect | undefined = rows[0];
    return result;
  },

  listRules(propertyId: string) {
    return db
      .select()
      .from(propertyRule)
      .where(eq(propertyRule.propertyId, propertyId))
      .orderBy(propertyRule.createdAt);
  },

  async upsertRule(
    propertyId: string,
    input: { category: string; content: string },
  ) {
    const [existing] = await db
      .select({ id: propertyRule.id })
      .from(propertyRule)
      .where(
        and(
          eq(propertyRule.propertyId, propertyId),
          eq(propertyRule.category, input.category),
        ),
      )
      .limit(1);

    if (existing) {
      const rows = await db
        .update(propertyRule)
        .set({ content: input.content })
        .where(eq(propertyRule.id, existing.id))
        .returning();
      return rows[0];
    }

    const rows = await db
      .insert(propertyRule)
      .values({
        id: crypto.randomUUID(),
        propertyId,
        category: input.category,
        content: input.content,
      })
      .returning();
    return rows[0];
  },

  async removeRule(propertyId: string, category: string) {
    const rows = await db
      .delete(propertyRule)
      .where(
        and(
          eq(propertyRule.propertyId, propertyId),
          eq(propertyRule.category, category),
        ),
      )
      .returning();
    return rows[0];
  },
};
