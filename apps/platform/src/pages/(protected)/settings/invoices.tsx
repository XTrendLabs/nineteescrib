import { createFileRoute } from "@tanstack/react-router";

import { BillingInvoicesSection } from "@/features/settings/components/billing-invoices-section";

export const Route = createFileRoute("/(protected)/settings/invoices")({
  component: BillingInvoicesSection,
});
