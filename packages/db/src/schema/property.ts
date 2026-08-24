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

export const property = pgTable(
  "property",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("property_organizationId_idx").on(table.organizationId),
    index("property_slug_idx").on(table.slug),
  ],
);

export const roomType = pgTable(
  "room_type",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => property.id, { onDelete: "cascade" }),
    name: text("name").default("Entire Property").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("room_type_propertyId_idx").on(table.propertyId)],
);

export const propertyRelations = relations(property, ({ one, many }) => ({
  organization: one(organization, {
    fields: [property.organizationId],
    references: [organization.id],
  }),
  roomTypes: many(roomType),
}));

export const roomTypeRelations = relations(roomType, ({ one }) => ({
  property: one(property, {
    fields: [roomType.propertyId],
    references: [property.id],
  }),
}));
