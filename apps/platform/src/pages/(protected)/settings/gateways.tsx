import { createFileRoute } from "@tanstack/react-router";

import { PaymentGatewaysSection } from "@/features/settings/components/payment-gateways-section";

export const Route = createFileRoute("/(protected)/settings/gateways")({
  component: PaymentGatewaysSection,
});
