import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { ShieldCheckIcon } from "lucide-react";

import { EmptyTabState } from "../empty-tab-state";

export function PoliciesTab() {
  const feedback = useFeedback();

  return (
    <EmptyTabState
      icon={ShieldCheckIcon}
      title="No policies configured yet"
      description="Set check-in/check-out times, cancellation rules, house rules, and amenities for this property."
      actionLabel="Add Policies"
      onAction={() =>
        feedback.success(
          "Coming soon",
          "Policy configuration is being built — check back shortly.",
        )
      }
    />
  );
}
