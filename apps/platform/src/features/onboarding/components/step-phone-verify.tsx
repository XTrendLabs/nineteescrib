import { Button } from "@propertyos/ui/components/button";
import { Input } from "@propertyos/ui/components/input";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { RotateCw } from "lucide-react";
import { useRef, useState } from "react";

import { useSendPhoneOtp, useVerifyPhoneOtp } from "../api/use-phone-otp";

const CODE_LENGTH = 6;
const DIGIT_IDS = Array.from(
  { length: CODE_LENGTH },
  (_, i) => `otp-digit-${i}`,
);

export function StepPhoneVerify({
  organizationId,
  phoneNumber,
  onVerified,
}: {
  organizationId: string;
  phoneNumber: string;
  onVerified: () => void;
}) {
  const feedback = useFeedback();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtp = useSendPhoneOtp();
  const verifyOtp = useVerifyPhoneOtp();

  const sendCode = () => {
    sendOtp.mutate(
      { json: { organizationId, phoneNumber } },
      {
        onSuccess: (res) => {
          feedback.success(
            "Code sent",
            `A verification code was sent to ${phoneNumber}. Dev code: ${res.data.devCode}`,
          );
        },
        onError: (error) => {
          feedback.error("Couldn't send code", error.message);
        },
      },
    );
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "")) {
      submitCode(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (pasted.length === CODE_LENGTH) {
      e.preventDefault();
      setDigits(pasted.split(""));
      submitCode(pasted);
    }
  };

  const submitCode = (code: string) => {
    verifyOtp.mutate(
      { json: { organizationId, code } },
      {
        onSuccess: () => {
          feedback.success("Phone verified");
          onVerified();
        },
        onError: (error) => {
          feedback.error("Verification failed", error.message);
          setDigits(Array(CODE_LENGTH).fill(""));
          inputsRef.current[0]?.focus();
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-display-sm">Verify your phone</h1>
        <p className="text-balance text-muted-foreground text-sm">
          {sendOtp.isSuccess
            ? `Enter the 6-digit code sent to ${phoneNumber}`
            : `We'll send a verification code to ${phoneNumber}`}
        </p>
      </div>

      {sendOtp.isSuccess ? (
        <>
          <div className="flex justify-center gap-2">
            {DIGIT_IDS.map((id, index) => (
              <Input
                key={id}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                value={digits[index]}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                inputMode="numeric"
                maxLength={1}
                disabled={verifyOtp.isPending}
                className="h-12 w-10 text-center text-lg"
              />
            ))}
          </div>

          <Button
            variant="ghost"
            type="button"
            onClick={sendCode}
            disabled={sendOtp.isPending}
            className="mx-auto"
          >
            <RotateCw className="size-3.5" />
            Resend code
          </Button>
        </>
      ) : (
        <Button type="button" onClick={sendCode} disabled={sendOtp.isPending}>
          {sendOtp.isPending ? "Sending..." : "Send verification code"}
        </Button>
      )}
    </div>
  );
}
