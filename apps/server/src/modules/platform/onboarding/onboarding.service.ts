import { AppError } from "../../../core";
import { onboardingRepo } from "./onboarding.repo";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

function generateOtp() {
  return Math.floor(Math.random() * 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

export const onboardingService = {
  async sendPhoneOtp(input: {
    organizationId: string;
    userId: string;
    phoneNumber: string;
  }) {
    const membership = await onboardingRepo.findMembership(
      input.organizationId,
      input.userId,
    );
    if (!membership) {
      throw AppError.forbidden("Not a member of this organization");
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await onboardingRepo.createVerification({
      memberId: membership.id,
      phoneNumber: input.phoneNumber,
      code,
      expiresAt,
    });

    // Stubbed SMS transport — logs server-side and returns the code so the
    // client can surface it via toast until a real provider is wired up.
    console.log(`[onboarding] OTP for ${input.phoneNumber}: ${code}`);

    return { devCode: code };
  },

  async verifyPhoneOtp(input: {
    organizationId: string;
    userId: string;
    code: string;
  }) {
    const membership = await onboardingRepo.findMembership(
      input.organizationId,
      input.userId,
    );
    if (!membership) {
      throw AppError.forbidden("Not a member of this organization");
    }

    const verification = await onboardingRepo.findLatestVerification(
      membership.id,
    );
    if (!verification) {
      throw AppError.validation("No verification in progress");
    }

    if (verification.expiresAt < new Date()) {
      throw AppError.validation("Code expired");
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      throw AppError.rateLimited();
    }

    if (verification.code !== input.code) {
      await onboardingRepo.incrementAttempts(
        verification.id,
        verification.attempts + 1,
      );
      throw AppError.validation("Invalid code");
    }

    await onboardingRepo.markPhoneVerified(
      membership.id,
      verification.phoneNumber,
    );

    return { success: true as const };
  },

  async setMemberTitle(input: {
    organizationId: string;
    userId: string;
    title: string;
  }) {
    const membership = await onboardingRepo.findMembership(
      input.organizationId,
      input.userId,
    );
    if (!membership) {
      throw AppError.forbidden("Not a member of this organization");
    }

    await onboardingRepo.setTitle(membership.id, input.title);

    return { success: true as const };
  },
};
