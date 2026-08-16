import { api } from "@/shared/lib/api-client";

export function useSendPhoneOtp() {
  return api.platform.onboarding["send-otp"].$post.useMutation();
}

export function useVerifyPhoneOtp() {
  return api.platform.onboarding["verify-otp"].$post.useMutation();
}
