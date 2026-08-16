import { createDb } from "@propertyos/db";
import { organizationPhoneVerification } from "@propertyos/db/schema/onboarding";
import { member, organization } from "@propertyos/db/schema/organization";
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
    organizationId: string;
    phoneNumber: string;
    code: string;
    expiresAt: Date;
  }) {
    return db.insert(organizationPhoneVerification).values({
      id: crypto.randomUUID(),
      ...input,
    });
  },

  findLatestVerification(organizationId: string) {
    return db
      .select()
      .from(organizationPhoneVerification)
      .where(eq(organizationPhoneVerification.organizationId, organizationId))
      .orderBy(organizationPhoneVerification.createdAt)
      .limit(1)
      .then((rows) => rows[0]);
  },

  incrementAttempts(verificationId: string, attempts: number) {
    return db
      .update(organizationPhoneVerification)
      .set({ attempts })
      .where(eq(organizationPhoneVerification.id, verificationId));
  },

  markPhoneVerified(organizationId: string, phoneNumber: string) {
    return db
      .update(organization)
      .set({ phoneNumber, phoneNumberVerifiedAt: new Date() })
      .where(eq(organization.id, organizationId));
  },

  setTitle(memberId: string, title: string) {
    return db.update(member).set({ title }).where(eq(member.id, memberId));
  },
};
