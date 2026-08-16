import { createFileRoute } from "@tanstack/react-router";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import SignInForm from "@/features/auth/components/sign-in-form";

export const Route = createFileRoute("/auth/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
