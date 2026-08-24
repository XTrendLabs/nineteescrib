import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { BedDoubleIcon } from "lucide-react";

import { EmptyTabState } from "../empty-tab-state";

export function RoomsTab() {
  const feedback = useFeedback();

  return (
    <EmptyTabState
      icon={BedDoubleIcon}
      title="No rooms added yet"
      description="Add room types with pricing, capacity, amenities, and photos to start taking bookings."
      actionLabel="Add Room"
      onAction={() =>
        feedback.success(
          "Coming soon",
          "Room management is being built — check back shortly.",
        )
      }
    />
  );
}
