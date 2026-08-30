import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "./organization";

/**
 * The categories a vendor can be filed under. These mirror the expense
 * categories, since a vendor is classified by the kind of spend they account
 * for -- a plumber is a maintenance vendor because their invoices are
 * maintenance expenses.
 */
export const vendorCategoryValues = [
  "maintenance",
  "utilities",
  "supplies",
  "salaries",
  "admin",
  "marketing",
  "capex",
  "other",
] as const;

/**
 * Suppliers the business buys from.
 *
 * Vendors sit at the HQ, not on a property: the same electrician bills three
 * properties, and duplicating them per property would split one supplier's
 * payment history into unrelated pieces. Anyone working under the HQ -- at HQ
 * scope or inside one of its properties -- reads the same directory.
 */
export const vendor = pgTable(
  "vendor",
  {
    id: text("id").primaryKey(),
    hqOrganizationId: text("hq_organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    phone: text("phone"),
    email: text("email"),
    category: text("category").default("other").notNull(),
    /** The vendor's GST number, used to decide whether input tax is claimable. */
    gstin: text("gstin"),
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("vendor_hqOrganizationId_idx").on(table.hqOrganizationId),
    // The directory's category filter reads within one HQ, so the two columns
    // are indexed together rather than filtering the HQ's whole list in memory.
    index("vendor_hqOrganizationId_category_idx").on(
      table.hqOrganizationId,
      table.category,
    ),
  ],
);

export const vendorRelations = relations(vendor, ({ one }) => ({
  hqOrganization: one(organization, {
    fields: [vendor.hqOrganizationId],
    references: [organization.id],
  }),
}));
