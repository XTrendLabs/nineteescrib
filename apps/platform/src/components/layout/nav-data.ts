import {
  BarChart3Icon,
  Building2Icon,
  LayoutGridIcon,
  UsersIcon,
} from "lucide-react";

import type { NavMainItem } from "./nav-main";

export const navMainItems: NavMainItem[] = [
  { title: "HQ", url: "/", icon: LayoutGridIcon },
  { title: "Properties", url: "/properties", icon: Building2Icon },
  { title: "Staff", url: "/staff", icon: UsersIcon },
  { title: "Reports", url: "/reports", icon: BarChart3Icon },
];
