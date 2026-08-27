import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@propertyos/ui/components/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";

export type NavMainItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  soon?: true;
  /**
   * The all-properties list belongs to an HQ. While a single property is the
   * active scope this entry stays visible but points into that property
   * instead, since /properties is not reachable at property scope.
   */
  hqOnly?: true;
};

export type NavMainGroup = {
  label?: string;
  items: NavMainItem[];
};

export function NavMain({ groups }: { groups: NavMainGroup[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isHqActive, activePropertySlug } = useActiveHq();

  /**
   * At property scope the all-properties list is off limits, so its nav entry
   * links into the active property instead of disappearing.
   */
  const resolveUrl = (item: NavMainItem) =>
    item.hqOnly && !isHqActive && activePropertySlug
      ? `/properties/${activePropertySlug}`
      : item.url;

  return (
    <>
      {groups.map((group, idx) => (
        <SidebarGroup key={group.label || idx} className="py-2 first:pt-4">
          {group.label && (
            <SidebarGroupLabel className="font-semibold text-[10px] text-muted-foreground/60 uppercase tracking-wider">
              {group.label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const url = resolveUrl(item);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={pathname === url}
                      className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground"
                      render={<Link to={url} />}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                      {item.soon && (
                        <span className="absolute top-1/2 right-3 -translate-y-1/2 font-medium text-[10px] text-muted-foreground/50 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                          SOON
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
