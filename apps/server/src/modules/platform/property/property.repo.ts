import { createDb } from "@propertyos/db";
import { organization } from "@propertyos/db/schema/organization";
import { propertyDetails, propertyRule } from "@propertyos/db/schema/property";
import { room } from "@propertyos/db/schema/room";
import { and, eq, like, sql } from "drizzle-orm";
import slugify from "slugify";

const db = createDb();

/**
 * A property is an organization of kind "property"; `propertyDetails` holds the
 * hospitality-specific columns. Every read joins the two so callers keep seeing
 * one flat property object.
 */
const propertyColumns = {
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
  logo: organization.logo,
  parentOrganizationId: organization.parentOrganizationId,
  propertyType: propertyDetails.propertyType,
  addressLine1: propertyDetails.addressLine1,
  city: propertyDetails.city,
  state: propertyDetails.state,
  country: propertyDetails.country,
  coverImage: propertyDetails.coverImage,
  status: propertyDetails.status,
  ownerName: propertyDetails.ownerName,
  contactPhone: propertyDetails.contactPhone,
  contactEmail: propertyDetails.contactEmail,
  whatsappNumber: propertyDetails.whatsappNumber,
  operationsOpenTime: propertyDetails.operationsOpenTime,
  operationsCloseTime: propertyDetails.operationsCloseTime,
  invoicePrefix: propertyDetails.invoicePrefix,
  gstNumber: propertyDetails.gstNumber,
  panNumber: propertyDetails.panNumber,
  billingAddress: propertyDetails.billingAddress,
  bankAccountHolderName: propertyDetails.bankAccountHolderName,
  bankAccountNumber: propertyDetails.bankAccountNumber,
  bankIfscCode: propertyDetails.bankIfscCode,
  bankName: propertyDetails.bankName,
  checkInTime: propertyDetails.checkInTime,
  checkOutTime: propertyDetails.checkOutTime,
  minStayNights: propertyDetails.minStayNights,
  maxStayNights: propertyDetails.maxStayNights,
  createdAt: propertyDetails.createdAt,
  updatedAt: propertyDetails.updatedAt,
};

function selectProperties() {
  return db
    .select(propertyColumns)
    .from(propertyDetails)
    .innerJoin(
      organization,
      eq(organization.id, propertyDetails.organizationId),
    );
}

export async function generateUniquePropertySlug(name: string) {
  const base = slugify(name, { lower: true, strict: true }) || "property";

  // One round-trip: fetch the taken slugs in this family and pick the first
  // free suffix locally, instead of probing the database once per collision.
  const taken = await db
    .select({ slug: organization.slug })
    .from(organization)
    .where(like(organization.slug, `${base}%`));

  const used = new Set(taken.map((row) => row.slug));
  if (!used.has(base)) return base;

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export const propertyRepo = {
  /** Properties sitting under an HQ organization. */
  listByHq(hqOrganizationId: string) {
    return db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        propertyType: propertyDetails.propertyType,
        city: propertyDetails.city,
        status: propertyDetails.status,
      })
      .from(propertyDetails)
      .innerJoin(
        organization,
        eq(organization.id, propertyDetails.organizationId),
      )
      .where(eq(organization.parentOrganizationId, hqOrganizationId))
      .orderBy(propertyDetails.createdAt);
  },

  /**
   * The property plus the completion flags the detail page shows on its tabs.
   *
   * The flags are computed here as subqueries rather than by fetching the
   * rooms and rules separately: each round-trip to the database costs 100ms+,
   * and the page only needs to know *whether* anything is missing.
   */
  /** A single property in the same shape `listByHq` returns. */
  listSelf(organizationId: string) {
    return db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        propertyType: propertyDetails.propertyType,
        city: propertyDetails.city,
        status: propertyDetails.status,
      })
      .from(propertyDetails)
      .innerJoin(
        organization,
        eq(organization.id, propertyDetails.organizationId),
      )
      .where(eq(organization.id, organizationId));
  },

  async findBySlug(slug: string) {
    const [result] = await db
      .select({
        ...propertyColumns,
        hasPublishedRoom: sql<boolean>`exists (
          select 1 from ${room}
          where ${room.organizationId} = ${organization.id}
            and ${room.status} = 'published'
        )`,
        ruleCategories: sql<string[]>`coalesce((
          select array_agg(distinct ${propertyRule.category})
          from ${propertyRule}
          where ${propertyRule.organizationId} = ${organization.id}
        ), '{}')`,
      })
      .from(propertyDetails)
      .innerJoin(
        organization,
        eq(organization.id, propertyDetails.organizationId),
      )
      .where(eq(organization.slug, slug))
      .limit(1);
    return result;
  },

  async findById(id: string) {
    const [result] = await selectProperties()
      .where(eq(propertyDetails.organizationId, id))
      .limit(1);
    return result;
  },

  async updateCoverImage(organizationId: string, coverImage: string) {
    await db
      .update(propertyDetails)
      .set({ coverImage })
      .where(eq(propertyDetails.organizationId, organizationId));
    return this.findById(organizationId);
  },

  /**
   * Creates the details row for an organization that Better Auth has already
   * created. Organization creation itself stays with the auth plugin so the
   * creator gets an owner membership.
   */
  async createDetails(input: {
    organizationId: string;
    propertyType?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    country?: string;
  }) {
    const [created] = await db
      .insert(propertyDetails)
      .values(input)
      .returning();
    return created;
  },

  async updateBusinessDetails(
    organizationId: string,
    input: {
      ownerName: string;
      contactPhone: string;
      contactEmail: string;
      whatsappNumber: string;
      operationsOpenTime: string;
      operationsCloseTime: string;
    },
  ) {
    await db
      .update(propertyDetails)
      .set(input)
      .where(eq(propertyDetails.organizationId, organizationId));
    return this.findById(organizationId);
  },

  /** `name` lives on the organization row, the rest on the details row. */
  async updatePropertyDetails(
    organizationId: string,
    input: {
      name: string;
      propertyType: string;
      addressLine1?: string;
      city?: string;
      state?: string;
      country?: string;
    },
  ) {
    const { name, ...details } = input;

    await db
      .update(organization)
      .set({ name })
      .where(eq(organization.id, organizationId));

    await db
      .update(propertyDetails)
      .set(details)
      .where(eq(propertyDetails.organizationId, organizationId));

    return this.findById(organizationId);
  },

  async updateTaxDetails(
    organizationId: string,
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
    await db
      .update(propertyDetails)
      .set(input)
      .where(eq(propertyDetails.organizationId, organizationId));
    return this.findById(organizationId);
  },

  async updatePolicies(
    organizationId: string,
    input: {
      checkInTime: string;
      checkOutTime: string;
      minStayNights?: number;
      maxStayNights?: number;
    },
  ) {
    await db
      .update(propertyDetails)
      .set(input)
      .where(eq(propertyDetails.organizationId, organizationId));
    return this.findById(organizationId);
  },

  listRules(organizationId: string) {
    return db
      .select()
      .from(propertyRule)
      .where(eq(propertyRule.organizationId, organizationId))
      .orderBy(propertyRule.createdAt);
  },

  async upsertRule(
    organizationId: string,
    input: { category: string; content: string },
  ) {
    const [existing] = await db
      .select({ id: propertyRule.id })
      .from(propertyRule)
      .where(
        and(
          eq(propertyRule.organizationId, organizationId),
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
        organizationId,
        category: input.category,
        content: input.content,
      })
      .returning();
    return rows[0];
  },

  async removeRule(organizationId: string, category: string) {
    const rows = await db
      .delete(propertyRule)
      .where(
        and(
          eq(propertyRule.organizationId, organizationId),
          eq(propertyRule.category, category),
        ),
      )
      .returning();
    return rows[0];
  },
};
