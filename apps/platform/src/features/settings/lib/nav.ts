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
  soon?: boolean;
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
      {
        title: "Plan & Usage",
        url: "/settings/plan",
        icon: WalletCardsIcon,
        soon: true,
      },
      {
        title: "Invoices",
        url: "/settings/invoices",
        icon: ReceiptIcon,
        soon: true,
      },
    ],
  },
  {
    label: "Integrations",
    items: [
      {
        title: "Payment Gateways",
        url: "/settings/gateways",
        icon: CreditCardIcon,
        soon: true,
      },
      {
        title: "Notifications",
        url: "/settings/notifications",
        icon: ScrollTextIcon,
        soon: true,
      },
    ],
  },
  {
    label: "Security",
    items: [
      {
        title: "Authentication",
        url: "/settings/security",
        icon: ShieldIcon,
        soon: true,
      },
      {
        title: "Audit Log",
        url: "/settings/audit",
        icon: FileTextIcon,
        soon: true,
      },
    ],
  },
  {
    label: "Advanced",
    items: [
      {
        title: "Data Export",
        url: "/settings/export",
        icon: DownloadIcon,
        soon: true,
      },
      {
        title: "Danger Zone",
        url: "/settings/danger",
        icon: SkullIcon,
        soon: true,
      },
    ],
  },
];
