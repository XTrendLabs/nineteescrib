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

export type NavMainItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  soon?: true;
};

export type NavMainGroup = {
  label?: string;
  items: NavMainItem[];
};

export function NavMain({ groups }: { groups: NavMainGroup[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={pathname === item.url}
                    className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground"
                    render={<Link to={item.url} />}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span>{item.title}</span>
                    {item.soon && (
                      <span className="absolute top-1/2 right-3 -translate-y-1/2 font-bold text-[10px] text-muted-foreground tracking-wider group-data-[collapsible=icon]:hidden">
                        SOON
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
