import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/features/auth/lib/auth-client";
import { useCreateOrganization } from "@/features/onboarding/api/use-create-organization";
import { useCreateProperty } from "@/features/onboarding/api/use-create-property";
import { useUpdateOrganizationProfile } from "@/features/onboarding/api/use-update-organization-profile";
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
    const activeOrganization = organizations?.[0];
    if (activeOrganization?.phoneNumberVerifiedAt) {
      throw redirect({ to: "/" });
    }

    return { activeOrganization };
  },
});

function RouteComponent() {
  const { activeOrganization } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(activeOrganization ? 2 : 1);
  const [organizationId, setOrganizationId] = useState<string | null>(
    activeOrganization?.id ?? null,
  );
  const [organizationName, setOrganizationName] = useState(
    activeOrganization?.name ?? "",
  );
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(
    activeOrganization?.phoneNumber ?? "",
  );

  const createOrganization = useCreateOrganization();
  const updateOrganizationProfile = useUpdateOrganizationProfile();
  const createProperty = useCreateProperty();

  const finishOnboarding = () => {
    queryClient.clear();
    navigate({ to: "/" });
  };

  return (
    <OnboardingLayout step={step}>
      {step === 1 && (
        <StepProfile
          defaultValues={{ organizationName, title, phoneNumber }}
          onSubmit={async (values) => {
            if (organizationId) {
              await updateOrganizationProfile.mutateAsync({
                organizationId,
                name: values.organizationName,
                title: values.title,
                phoneNumber: values.phoneNumber,
              });
            } else {
              const result = await createOrganization.mutateAsync({
                name: values.organizationName,
                title: values.title,
                phoneNumber: values.phoneNumber,
              });
              setOrganizationId(result.organizationId);
            }
            setOrganizationName(values.organizationName);
            setTitle(values.title);
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
          onChangeNumber={() => setStep(1)}
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
