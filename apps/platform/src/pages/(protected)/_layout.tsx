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

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { authQueryKeys } from "@/features/auth/api/query-keys";
import {
  fetchActiveOrganization,
  fetchOrganizationList,
  getActiveOrganizationId,
} from "@/features/auth/api/use-cached-organizations";
import {
  fetchSession,
  SESSION_STALE_TIME,
} from "@/features/auth/api/use-cached-session";
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
    const activeOrganization = organizations?.[0];
    if (!activeOrganization?.phoneNumberVerifiedAt) {
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

  const title =
    activeView.type === "hq" ? "HQ" : (activePropertyName ?? "Property");

  return (
    <SidebarProvider>
      <AppSidebar
        activeView={activeView}
        onSelectHq={selectHq}
        onSelectProperty={selectProperty}
        onAddProperty={() => {
          navigate({ to: "/properties/new" });
        }}
      />
      <SidebarInset className="min-h-0">
        <SiteHeader
          title={title}
          onSelectHq={selectHq}
          onSelectProperty={selectProperty}
        />
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-0 dark:bg-sidebar-accent">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
