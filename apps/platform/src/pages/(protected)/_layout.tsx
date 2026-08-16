import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import Header from "@/components/header";
import { authClient } from "@/features/auth/lib/auth-client";

export const Route = createFileRoute("/(protected)")({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/auth/login",
      });
    }

    const { data: organizations } = await authClient.organization.list();
    const activeOrganization = organizations?.[0];
    if (!activeOrganization?.phoneNumberVerifiedAt) {
      throw redirect({
        to: "/onboarding",
      });
    }

    return { session };
  },
});

function ProtectedLayout() {
  return (
    <div className="grid h-svh grid-rows-[auto_1fr]">
      <Header />
      <Outlet />
    </div>
  );
}
