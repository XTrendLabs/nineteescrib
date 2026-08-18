import type { LucideIcon } from "lucide-react";
import {
  BuildingIcon,
  CreditCardIcon,
  DownloadIcon,
  FileTextIcon,
  ReceiptIcon,
  ScrollTextIcon,
  ShieldIcon,
  SkullIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";

export type SettingsNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export type SettingsNavGroup = {
  label: string;
  items: SettingsNavItem[];
};

export const settingsNavGroups: SettingsNavGroup[] = [
  {
    label: "General",
    items: [
      { title: "Company", url: "/settings/company", icon: BuildingIcon },
      { title: "Members", url: "/settings/members", icon: UsersIcon },
    ],
  },
  {
    label: "Billing",
    items: [
      { title: "Plan & Usage", url: "/settings/plan", icon: WalletCardsIcon },
      { title: "Invoices", url: "/settings/invoices", icon: ReceiptIcon },
    ],
  },
  {
    label: "Integrations",
    items: [
      {
        title: "Payment Gateways",
        url: "/settings/gateways",
        icon: CreditCardIcon,
      },
      {
        title: "Notifications",
        url: "/settings/notifications",
        icon: ScrollTextIcon,
      },
    ],
  },
  {
    label: "Security",
    items: [
      { title: "Authentication", url: "/settings/security", icon: ShieldIcon },
      { title: "Audit Log", url: "/settings/audit", icon: FileTextIcon },
    ],
  },
  {
    label: "Advanced",
    items: [
      { title: "Data Export", url: "/settings/export", icon: DownloadIcon },
      { title: "Danger Zone", url: "/settings/danger", icon: SkullIcon },
    ],
  },
];
