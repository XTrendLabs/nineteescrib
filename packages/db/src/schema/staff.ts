import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization } from "./organization";

export const staffRoleValues = [
  "admin",
  "manager",
  "caretaker",
  "housekeeping",
] as const;

export const staffStatusValues = [
  "active",
  "pending_invite",
  "inactive",
] as const;

export const staffGenderValues = ["male", "female", "other"] as const;

export const staff = pgTable(
  "staff",
  {
    id: text("id").primaryKey(),
    // Staff are hired at the HQ level and assigned to one or more property
    // organizations through `staffProperty`.
    hqOrganizationId: text("hq_organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    role: text("role").default("caretaker").notNull(),
    status: text("status").default("active").notNull(),
    photoUrl: text("photo_url"),
    dateOfBirth: text("date_of_birth"),
    gender: text("gender"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    state: text("state"),
    pinCode: text("pin_code"),
    emergencyName: text("emergency_name"),
    emergencyPhone: text("emergency_phone"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("staff_hqOrganizationId_idx").on(table.hqOrganizationId)],
);

/** Which properties a staff member works at. */
export const staffProperty = pgTable(
  "staff_property",
  {
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.staffId, table.organizationId] }),
    index("staff_property_staffId_idx").on(table.staffId),
    index("staff_property_organizationId_idx").on(table.organizationId),
  ],
);

export const staffRelations = relations(staff, ({ one, many }) => ({
  hqOrganization: one(organization, {
    fields: [staff.hqOrganizationId],
    references: [organization.id],
  }),
  properties: many(staffProperty),
}));

export const staffPropertyRelations = relations(staffProperty, ({ one }) => ({
  staff: one(staff, {
    fields: [staffProperty.staffId],
    references: [staff.id],
  }),
  organization: one(organization, {
    fields: [staffProperty.organizationId],
    references: [organization.id],
  }),
}));
