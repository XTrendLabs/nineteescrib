import { createDb } from "@propertyos/db";
import { memberPhoneVerification } from "@propertyos/db/schema/onboarding";
import { member } from "@propertyos/db/schema/organization";
import { and, eq } from "drizzle-orm";

const db = createDb();

export const onboardingRepo = {
  findMembership(organizationId: string, userId: string) {
    return db
      .select()
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.userId, userId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
  },

  createVerification(input: {
    memberId: string;
    phoneNumber: string;
    code: string;
    expiresAt: Date;
  }) {
    return db.insert(memberPhoneVerification).values({
      id: crypto.randomUUID(),
      ...input,
    });
  },

  findLatestVerification(memberId: string) {
    return db
      .select()
      .from(memberPhoneVerification)
      .where(eq(memberPhoneVerification.memberId, memberId))
      .orderBy(memberPhoneVerification.createdAt)
      .limit(1)
      .then((rows) => rows[0]);
  },

  incrementAttempts(verificationId: string, attempts: number) {
    return db
      .update(memberPhoneVerification)
      .set({ attempts })
      .where(eq(memberPhoneVerification.id, verificationId));
  },

  markPhoneVerified(memberId: string, phoneNumber: string) {
    return db
      .update(member)
      .set({ phoneNumber, phoneNumberVerifiedAt: new Date() })
      .where(eq(member.id, memberId));
  },

  setTitle(memberId: string, title: string) {
    return db.update(member).set({ title }).where(eq(member.id, memberId));
  },
};
