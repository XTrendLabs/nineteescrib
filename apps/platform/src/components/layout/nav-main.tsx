import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@propertyos/ui/components/sidebar";
import { cn } from "@propertyos/ui/lib/utils";
import { useRouterState } from "@tanstack/react-router";
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
                    tooltip={
                      item.soon ? `${item.title} (Coming Soon)` : item.title
                    }
                    isActive={!item.soon && pathname === item.url}
                    disabled={item.soon}
                    aria-disabled={item.soon}
                    className={cn(
                      "data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground",
                      item.soon && "pointer-events-none select-none opacity-50",
                    )}
                    render={
                      item.soon ? <span /> : <a href={item.url}>{item.title}</a>
                    }
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
