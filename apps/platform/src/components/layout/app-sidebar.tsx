import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@propertyos/ui/components/sidebar";
import type { ComponentProps } from "react";

import { HqPropertySwitcher } from "./hq-property-switcher";
import { navMainItems } from "./nav-data";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({
  activeView,
  onSelectHq,
  onSelectProperty,
  onAddProperty,
  ...props
}: ComponentProps<typeof Sidebar> & {
  activeView: { type: "hq" } | { type: "property"; propertyId: string };
  onSelectHq: () => void;
  onSelectProperty: (propertyId: string, name: string) => void;
  onAddProperty: () => void;
}) {
  return (
    <Sidebar collapsible="icon" className="sidebar-scope" {...props}>
      <SidebarHeader>
        <HqPropertySwitcher
          activeView={activeView}
          onSelectHq={onSelectHq}
          onSelectProperty={onSelectProperty}
          onAddProperty={onAddProperty}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
