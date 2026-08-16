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
    propertyType: text("property_type").notNull(),
    addressLine1: text("address_line1").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").notNull(),
    coverImage: text("cover_image"),
    status: text("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("property_organizationId_idx").on(table.organizationId)],
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
