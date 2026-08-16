import { honoClient } from "@/shared/lib/api-client";

export async function checkPhoneAvailable(
  phoneNumber: string,
  excludeOrganizationId?: string,
) {
  const res = await honoClient.api.platform.onboarding["check-phone"].$post({
    json: { phoneNumber, excludeOrganizationId },
  });

  if (!res.ok) {
    const body = (await res.json()) as unknown as {
      error?: { message?: string };
    };
    throw new Error(
      body.error?.message ?? "This phone number could not be verified",
    );
  }
}
