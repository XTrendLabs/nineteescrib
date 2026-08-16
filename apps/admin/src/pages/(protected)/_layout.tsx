import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import Header from "@/components/header";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/(protected)")({
  component: AuthLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/login",
      });
    }
    return { session };
  },
});

function AuthLayout() {
  return (
    <div className="grid h-svh grid-rows-[auto_1fr]">
      <Header />
      <Outlet />
    </div>
  );
}
