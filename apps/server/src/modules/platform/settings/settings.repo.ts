import { createDb } from "@propertyos/db";
import { organization } from "@propertyos/db/schema/organization";
import { organizationProfile } from "@propertyos/db/schema/settings";
import { eq } from "drizzle-orm";

const db = createDb();

export const settingsRepo = {
  /**
   * The organization's own name and slug, which the profile form shows
   * alongside the profile row's fields.
   *
   * Read here rather than widened onto the cached request scope: that scope is
   * loaded on every authorized request, and these two columns are wanted only
   * by this one screen.
   */
  async findOrganizationIdentity(organizationId: string) {
    const [row] = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);
    return row;
  },

  async findProfileByOrganization(organizationId: string) {
    const [row] = await db
      .select()
      .from(organizationProfile)
      .where(eq(organizationProfile.organizationId, organizationId))
      .limit(1);
    return row;
  },

  /**
   * Writes the profile, creating it if this organization has never saved one.
   *
   * A single upsert rather than a read-then-insert-or-update: two saves landing
   * together would both see "no row yet" and both insert, and the unique index
   * on `organizationId` would fail the loser with a constraint error instead of
   * saving their edit. `onConflictDoUpdate` makes the second one an update.
   */
  async upsertProfile(
    organizationId: string,
    input: Partial<typeof organizationProfile.$inferInsert>,
  ) {
    const [row] = await db
      .insert(organizationProfile)
      .values({ ...input, id: crypto.randomUUID(), organizationId })
      .onConflictDoUpdate({
        target: organizationProfile.organizationId,
        set: input,
      })
      .returning();
    return row;
  },
};
