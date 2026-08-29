import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@propertyos/ui/components/sidebar";
import type { ComponentProps } from "react";

import { HqPropertySwitcher } from "./hq-property-switcher";
import { navMainGroups } from "./nav-data";
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
  onSelectHq: (hqId?: string) => void;
  onSelectProperty: (propertyId: string) => void;
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
        <NavMain groups={navMainGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
