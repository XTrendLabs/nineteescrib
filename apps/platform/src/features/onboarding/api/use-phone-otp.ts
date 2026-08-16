import { api } from "@/shared/lib/api-client";

export function useSendPhoneOtp() {
  return api.api.platform.onboarding["send-otp"].$post.useMutation();
}

export function useVerifyPhoneOtp() {
  return api.api.platform.onboarding["verify-otp"].$post.useMutation();
}
