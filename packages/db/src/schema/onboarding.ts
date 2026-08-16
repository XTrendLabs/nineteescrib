import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { member } from "./organization";

export const memberPhoneVerification = pgTable(
  "member_phone_verification",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number").notNull(),
    code: text("code").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("member_phone_verification_memberId_idx").on(table.memberId),
  ],
);

export const memberPhoneVerificationRelations = relations(
  memberPhoneVerification,
  ({ one }) => ({
    member: one(member, {
      fields: [memberPhoneVerification.memberId],
      references: [member.id],
    }),
  }),
);
