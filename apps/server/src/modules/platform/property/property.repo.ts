import { createDb } from "@propertyos/db";
import { property, roomType } from "@propertyos/db/schema/property";
import { eq } from "drizzle-orm";
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

    await db.insert(roomType).values({
      id: crypto.randomUUID(),
      propertyId,
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
};
