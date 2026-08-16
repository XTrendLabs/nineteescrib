import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/features/auth/lib/auth-client";
import { useCreateOrganization } from "@/features/onboarding/api/use-create-organization";
import { useCreateProperty } from "@/features/onboarding/api/use-create-property";
import { OnboardingLayout } from "@/features/onboarding/components/onboarding-layout";
import { StepPhoneVerify } from "@/features/onboarding/components/step-phone-verify";
import { StepProfile } from "@/features/onboarding/components/step-profile";
import { StepProperty } from "@/features/onboarding/components/step-property";

export const Route = createFileRoute("/onboarding/")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({ to: "/auth/login" });
    }

    const { data: organizations } = await authClient.organization.list();
    if (organizations && organizations.length > 0) {
      throw redirect({ to: "/" });
    }
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  const createOrganization = useCreateOrganization();
  const createProperty = useCreateProperty();

  const finishOnboarding = () => {
    navigate({ to: "/" });
  };

  return (
    <OnboardingLayout step={step}>
      {step === 1 && (
        <StepProfile
          defaultValues={{ phoneNumber }}
          onSubmit={async (values) => {
            const result = await createOrganization.mutateAsync({
              name: values.organizationName,
              title: values.title,
            });
            setOrganizationId(result.organizationId);
            setPhoneNumber(values.phoneNumber);
            setStep(2);
          }}
        />
      )}

      {step === 2 && organizationId && (
        <StepPhoneVerify
          organizationId={organizationId}
          phoneNumber={phoneNumber}
          onVerified={() => setStep(3)}
        />
      )}

      {step === 3 && organizationId && (
        <StepProperty
          onSkip={finishOnboarding}
          onSubmit={async (values) => {
            await createProperty.mutateAsync({
              json: { organizationId, ...values },
            });
            finishOnboarding();
          }}
        />
      )}
    </OnboardingLayout>
  );
}
