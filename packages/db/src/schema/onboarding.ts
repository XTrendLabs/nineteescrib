import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "./organization";

export const organizationPhoneVerification = pgTable(
  "organization_phone_verification",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number").notNull(),
    code: text("code").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("organization_phone_verification_organizationId_idx").on(
      table.organizationId,
    ),
  ],
);

export const organizationPhoneVerificationRelations = relations(
  organizationPhoneVerification,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationPhoneVerification.organizationId],
      references: [organization.id],
    }),
  }),
);
