import {
  SidebarInset,
  SidebarProvider,
} from "@propertyos/ui/components/sidebar";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { authQueryKeys } from "@/features/auth/api/query-keys";
import {
  fetchActiveOrganization,
  fetchOrganizationList,
  getActiveOrganizationId,
  needsOnboarding,
  useActiveHq,
} from "@/features/auth/api/use-cached-organizations";
import {
  fetchSession,
  SESSION_STALE_TIME,
} from "@/features/auth/api/use-cached-session";
import { useHasPermission } from "@/features/auth/api/use-permission";
import { CreatePropertyDialog } from "@/features/properties/components/create-property-dialog";
import { WorkspaceSwitchOverlay } from "@/shared/components/workspace-switch-overlay";
import { useActiveView } from "@/shared/lib/use-active-view";

export const Route = createFileRoute("/(protected)")({
  component: ProtectedLayout,
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData({
      queryKey: authQueryKeys.session(),
      queryFn: fetchSession,
      staleTime: SESSION_STALE_TIME,
    });
    if (!session) {
      throw redirect({
        to: "/auth/login",
      });
    }

    const organizations = await context.queryClient.ensureQueryData({
      queryKey: authQueryKeys.organizations(session.user.id),
      queryFn: fetchOrganizationList,
      staleTime: SESSION_STALE_TIME,
    });
    // Onboarding exists to set up an HQ. Someone invited into an existing
    // property already belongs somewhere, so sending them through it would
    // strand them -- only an owner with an unverified HQ needs it.
    if (needsOnboarding(organizations)) {
      throw redirect({
        to: "/onboarding",
      });
    }

    await context.queryClient.ensureQueryData({
      queryKey: authQueryKeys.activeOrganization(
        session.user.id,
        getActiveOrganizationId(session),
      ),
      queryFn: fetchActiveOrganization,
      staleTime: SESSION_STALE_TIME,
    });

    return { session: { data: session } };
  },
});

function ProtectedLayout() {
  const navigate = useNavigate();
  const { activeView, activePropertyName, selectHq, selectProperty } =
    useActiveView();
  // New properties always hang off the HQ in scope, never off whichever
  // property happens to be active.
  const { activeHqId, activeHq } = useActiveHq();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  // Staff cannot create properties, so they are never offered the option --
  // the server refuses it either way.
  const canCreateProperty = useHasPermission("property", "create");

  const openCreateDialog = canCreateProperty
    ? () => setCreateDialogOpen(true)
    : undefined;

  const title =
    activeView.type === "hq"
      ? (activeHq?.name ?? "HQ")
      : (activePropertyName ?? "Property");

  return (
    <SidebarProvider>
      <AppSidebar
        activeView={activeView}
        onSelectHq={selectHq}
        onSelectProperty={selectProperty}
        onAddProperty={openCreateDialog}
      />
      <SidebarInset className="min-h-0">
        <SiteHeader
          title={title}
          onSelectHq={selectHq}
          onSelectProperty={selectProperty}
          onAddProperty={openCreateDialog}
        />
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-0 dark:bg-sidebar-accent">
          <Outlet />
        </div>
      </SidebarInset>

      <WorkspaceSwitchOverlay />

      {canCreateProperty && (
        <CreatePropertyDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          organizationId={activeHqId}
          onCreated={(slug) =>
            navigate({
              to: "/properties/$propertySlug",
              params: { propertySlug: slug },
            })
          }
        />
      )}
    </SidebarProvider>
  );
}
