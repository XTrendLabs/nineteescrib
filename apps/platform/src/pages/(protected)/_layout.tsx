import {
  SidebarInset,
  SidebarProvider,
} from "@propertyos/ui/components/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { authClient } from "@/features/auth/lib/auth-client";

type ActiveView = { type: "hq" } | { type: "property"; propertyId: string };

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
  const [activeView, setActiveView] = useState<ActiveView>({ type: "hq" });
  const [activePropertyName, setActivePropertyName] = useState<string>();

  const title =
    activeView.type === "hq" ? "HQ" : (activePropertyName ?? "Property");

  const selectHq = () => setActiveView({ type: "hq" });
  const selectProperty = (propertyId: string, name: string) => {
    setActiveView({ type: "property", propertyId });
    setActivePropertyName(name);
  };

  return (
    <SidebarProvider>
      <AppSidebar
        activeView={activeView}
        onSelectHq={selectHq}
        onSelectProperty={selectProperty}
        onAddProperty={() => {
          window.location.href = "/properties/new";
        }}
      />
      <SidebarInset>
        <SiteHeader
          title={title}
          onSelectHq={selectHq}
          onSelectProperty={selectProperty}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 dark:bg-sidebar-accent">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
