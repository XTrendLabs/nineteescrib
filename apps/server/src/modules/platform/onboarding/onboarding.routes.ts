import z from "zod";

import { AppError, createRouter, ok, requireSession } from "../../../core";
import { onboardingService } from "./onboarding.service";

const checkPhoneSchema = z.object({
  phoneNumber: z.string().min(6),
  excludeOrganizationId: z.string().min(1).optional(),
});

const sendOtpSchema = z.object({
  organizationId: z.string().min(1),
  phoneNumber: z.string().min(6),
});

const verifyOtpSchema = z.object({
  organizationId: z.string().min(1),
  code: z.string().length(6),
});

const setTitleSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1),
});

export const onboardingRoutes = createRouter()
  .use(requireSession)
  .post("/check-phone", async (c) => {
    const body = checkPhoneSchema.safeParse(await c.req.json());
    if (!body.success) {
      throw AppError.validation("Invalid request", body.error.flatten());
    }

    const result = await onboardingService.checkPhoneAvailable(body.data);

    return c.json(ok(result));
  })
  .post("/send-otp", async (c) => {
    const body = sendOtpSchema.safeParse(await c.req.json());
    if (!body.success) {
      throw AppError.validation("Invalid request", body.error.flatten());
    }

    const session = c.get("session");
    const result = await onboardingService.sendPhoneOtp({
      ...body.data,
      userId: session.user.id,
    });

    return c.json(ok(result));
  })
  .post("/verify-otp", async (c) => {
    const body = verifyOtpSchema.safeParse(await c.req.json());
    if (!body.success) {
      throw AppError.validation("Invalid request", body.error.flatten());
    }

    const session = c.get("session");
    const result = await onboardingService.verifyPhoneOtp({
      ...body.data,
      userId: session.user.id,
    });

    return c.json(ok(result));
  })
  .post("/member-title", async (c) => {
    const body = setTitleSchema.safeParse(await c.req.json());
    if (!body.success) {
      throw AppError.validation("Invalid request", body.error.flatten());
    }

    const session = c.get("session");
    const result = await onboardingService.setMemberTitle({
      ...body.data,
      userId: session.user.id,
    });

    return c.json(ok(result));
  });
