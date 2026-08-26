import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization } from "./organization";

export const roomTypeValues = [
  "single",
  "double",
  "twin",
  "deluxe",
  "suite",
  "dormitory",
  "entire_property",
  "other",
] as const;

export const amenity = pgTable("amenity", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roomStatusValues = ["draft", "published"] as const;

export const room = pgTable(
  "room",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    roomNumber: text("room_number"),
    floor: text("floor"),
    roomType: text("room_type").default("other").notNull(),
    status: text("status").default("draft").notNull(),
    weekdayPrice: integer("weekday_price").default(0).notNull(),
    weekendPrice: integer("weekend_price").default(0).notNull(),
    maxGuests: integer("max_guests").default(2).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("room_organizationId_idx").on(table.organizationId)],
);

export const roomImage = pgTable(
  "room_image",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => room.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("room_image_roomId_idx").on(table.roomId)],
);

export const roomAmenity = pgTable(
  "room_amenity",
  {
    roomId: text("room_id")
      .notNull()
      .references(() => room.id, { onDelete: "cascade" }),
    amenityId: text("amenity_id")
      .notNull()
      .references(() => amenity.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.amenityId] }),
    index("room_amenity_roomId_idx").on(table.roomId),
    index("room_amenity_amenityId_idx").on(table.amenityId),
  ],
);

export const roomRelations = relations(room, ({ one, many }) => ({
  organization: one(organization, {
    fields: [room.organizationId],
    references: [organization.id],
  }),
  roomAmenities: many(roomAmenity),
  images: many(roomImage),
}));

export const roomImageRelations = relations(roomImage, ({ one }) => ({
  room: one(room, {
    fields: [roomImage.roomId],
    references: [room.id],
  }),
}));

export const amenityRelations = relations(amenity, ({ many }) => ({
  roomAmenities: many(roomAmenity),
}));

export const roomAmenityRelations = relations(roomAmenity, ({ one }) => ({
  room: one(room, {
    fields: [roomAmenity.roomId],
    references: [room.id],
  }),
  amenity: one(amenity, {
    fields: [roomAmenity.amenityId],
    references: [amenity.id],
  }),
}));
