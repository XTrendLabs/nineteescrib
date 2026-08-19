import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { formatMinutesSeconds } from "@/features/booking-engine/lib/format";
import { HOLD_DURATION_SECONDS } from "@/features/booking-engine/lib/mock-data";

export function HoldTimer({ onExpire }: { onExpire?: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(HOLD_DURATION_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire?.();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, onExpire]);

  const isUrgent = secondsLeft <= 120;

  return (
    <p
      className={`flex items-center gap-1.5 text-xs ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}
    >
      <ClockIcon className="size-3.5" />
      Room held for {formatMinutesSeconds(secondsLeft)} minutes
    </p>
  );
}
