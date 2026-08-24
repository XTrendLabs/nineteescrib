import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { LinkIcon } from "lucide-react";

import { EmptyTabState } from "../empty-tab-state";

export function BookingLinksTab() {
  const feedback = useFeedback();

  return (
    <EmptyTabState
      icon={LinkIcon}
      title="Booking link not set up yet"
      description="Publish a public booking page for this property and generate private deal links for guests."
      actionLabel="Set Up Booking Link"
      onAction={() =>
        feedback.success(
          "Coming soon",
          "Booking link setup is being built — check back shortly.",
        )
      }
    />
  );
}
