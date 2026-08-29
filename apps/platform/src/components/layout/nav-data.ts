import {
  BarChart3Icon,
  Building2Icon,
  CalendarIcon,
  ClipboardListIcon,
  ContactIcon,
  FileTextIcon,
  LayoutGridIcon,
  ReceiptIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import type { NavMainItem } from "./nav-main";

export type NavMainGroup = {
  label?: string;
  items: NavMainItem[];
};

export const navMainGroups: NavMainGroup[] = [
  {
    items: [
      { title: "Overview", url: "/", icon: LayoutGridIcon, soon: true },
      { title: "Calendar", url: "/calendar", icon: CalendarIcon, soon: true },
      {
        title: "Bookings",
        url: "/bookings",
        icon: ClipboardListIcon,
        soon: true,
      },
      { title: "Guests", url: "/guests", icon: ContactIcon, soon: true },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Invoices", url: "/invoices", icon: FileTextIcon, soon: true },
      { title: "Expenses", url: "/expenses", icon: ReceiptIcon, soon: true },
      { title: "Reports", url: "/reports", icon: BarChart3Icon, soon: true },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Staff", url: "/staff", icon: UsersIcon },
      {
        title: "Properties",
        url: "/properties",
        icon: Building2Icon,
        // The all-properties list belongs to an HQ; someone scoped to a single
        // property has no such list to open.
        hqOnly: true,
      },
      { title: "Settings", url: "/settings", icon: SettingsIcon, soon: true },
    ],
  },
];
