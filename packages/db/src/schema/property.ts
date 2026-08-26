import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "./organization";

export const propertyTypeValues = [
  "villa",
  "apartment",
  "hotel",
  "homestay",
  "other",
] as const;

export const propertyRuleCategoryValues = [
  "property_rules",
  "cancellation_policy",
  "damage_policy",
  "checkin_checkout_instructions",
] as const;

export const propertyStatusValues = ["active", "inactive"] as const;

// A property *is* an organization (kind "property"); this table carries only
// the hospitality-specific attributes that Better Auth does not own. Identity
// -- name, slug, logo -- stays on `organization` so the auth plugin remains
// the single writer for it.
export const propertyDetails = pgTable(
  "property_details",
  {
    organizationId: text("organization_id")
      .primaryKey()
      .references(() => organization.id, { onDelete: "cascade" }),
    propertyType: text("property_type").default("other").notNull(),
    addressLine1: text("address_line1").default("").notNull(),
    city: text("city").default("").notNull(),
    state: text("state").default("").notNull(),
    country: text("country").default("India").notNull(),
    coverImage: text("cover_image"),
    status: text("status").default("active").notNull(),
    ownerName: text("owner_name"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    whatsappNumber: text("whatsapp_number"),
    operationsOpenTime: text("operations_open_time"),
    operationsCloseTime: text("operations_close_time"),
    invoicePrefix: text("invoice_prefix"),
    gstNumber: text("gst_number"),
    panNumber: text("pan_number"),
    billingAddress: text("billing_address"),
    bankAccountHolderName: text("bank_account_holder_name"),
    bankAccountNumber: text("bank_account_number"),
    bankIfscCode: text("bank_ifsc_code"),
    bankName: text("bank_name"),
    checkInTime: text("check_in_time"),
    checkOutTime: text("check_out_time"),
    minStayNights: integer("min_stay_nights"),
    maxStayNights: integer("max_stay_nights"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("property_details_status_idx").on(table.status)],
);

export const propertyRule = pgTable(
  "property_rule",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("property_rule_organizationId_idx").on(table.organizationId),
    index("property_rule_organizationId_category_idx").on(
      table.organizationId,
      table.category,
    ),
  ],
);

export const propertyDetailsRelations = relations(
  propertyDetails,
  ({ one }) => ({
    organization: one(organization, {
      fields: [propertyDetails.organizationId],
      references: [organization.id],
    }),
  }),
);

export const propertyRuleRelations = relations(propertyRule, ({ one }) => ({
  organization: one(organization, {
    fields: [propertyRule.organizationId],
    references: [organization.id],
  }),
}));
