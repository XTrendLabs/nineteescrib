import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { organization } from "./organization";

/**
 * The business identity behind an organization: registered address, tax
 * identity and the contact details that appear on invoices, owner statements
 * and legal footers.
 *
 * This is a table of its own rather than more columns on `organization`
 * because that table belongs to Better Auth's organization plugin -- its shape
 * is the plugin's to change, and a dozen business columns bolted onto it would
 * collide with the plugin's own migrations. The split also matches how the
 * data is read: the profile is loaded on one settings screen, while
 * `organization` is on the session's hot path.
 *
 * The row is created lazily on first save, so an organization without one is
 * normal and means "never filled in" rather than missing data.
 */
export const organizationProfile = pgTable(
  "organization_profile",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    /**
     * The registered legal name, which can differ from `organization.name` --
     * the latter is what staff see in the switcher, this is what goes on a
     * tax invoice.
     */
    companyName: text("company_name"),
    /** Trading name, used where the legal entity would read as noise. */
    displayName: text("display_name"),

    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: text("city"),
    state: text("state"),
    country: text("country"),
    pin: text("pin"),

    /** Indian tax identity. Nullable: a business may register for GST later. */
    pan: text("pan"),
    gstin: text("gstin"),
    /** Companies only -- a proprietorship or LLP has none. */
    cin: text("cin"),

    businessEmail: text("business_email"),
    businessPhone: text("business_phone"),
    supportEmail: text("support_email"),
    website: text("website"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // One profile per organization. Unique rather than a plain index because
    // the lazy create-on-first-save would otherwise let two concurrent saves
    // leave the organization with two profiles and no defined winner.
    uniqueIndex("organization_profile_organizationId_uidx").on(
      table.organizationId,
    ),
  ],
);

export const organizationProfileRelations = relations(
  organizationProfile,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationProfile.organizationId],
      references: [organization.id],
    }),
  }),
);
