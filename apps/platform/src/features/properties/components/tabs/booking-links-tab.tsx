import { Button } from "@propertyos/ui/components/button";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { CopyIcon, ExternalLinkIcon, LinkIcon } from "lucide-react";

import { isBookingEngineEnabled } from "@/features/booking-engine/lib/feature-flag";
import { EmptyTabState } from "../empty-tab-state";

export function BookingLinksTab({ propertySlug }: { propertySlug: string }) {
  const feedback = useFeedback();

  // Off: the public pages are gated too, so a link handed out now would lead
  // to the "being built" notice. Better to say so here than to let someone
  // send it to a guest.
  if (!isBookingEngineEnabled) {
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

  // The public page keys off the property's own slug, which is unique across
  // the whole system -- so the link needs nothing above it.
  const link = `${window.location.origin}/book/${propertySlug}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 border p-4">
        <p className="font-medium text-sm">Public booking link</p>
        <p className="text-muted-foreground text-xs">
          Anyone with this link can see live availability and book directly.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 break-all border bg-muted/30 px-2.5 py-2 text-[11px]">
            {link}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(link);
              feedback.success("Link copied", "Paste it anywhere to share.");
            }}
          >
            <CopyIcon />
            Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(link, "_blank", "noopener")}
          >
            <ExternalLinkIcon />
            Open
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Only published rooms are offered, and payment is simulated until the
        gateway is connected — bookings arrive unpaid.
      </p>
    </div>
  );
}
