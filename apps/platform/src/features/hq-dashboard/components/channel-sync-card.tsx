import { Button } from "@propertyos/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { cn } from "@propertyos/ui/lib/utils";
import {
  AlertTriangleIcon,
  ClockIcon,
  RadioIcon,
  WifiIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

import type { MockProperty } from "../lib/mock-data";
import {
  buildChannelHeartbeats,
  buildCheckoutHolds,
  buildConflictAlerts,
} from "../lib/mock-data";

export function ChannelSyncCard({
  properties,
}: {
  properties: MockProperty[];
}) {
  const holds = useMemo(() => buildCheckoutHolds(properties), [properties]);
  const heartbeats = useMemo(() => buildChannelHeartbeats(), []);
  const conflicts = useMemo(
    () => buildConflictAlerts(properties),
    [properties],
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base">
          Channel sync & live activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        {conflicts.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              <AlertTriangleIcon className="size-3.5" />
              Conflict alerts
            </p>
            {conflicts.map((conflict, index) => (
              <motion.div
                key={conflict.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 220,
                  damping: 22,
                }}
                className="flex items-start justify-between gap-3 border-2 border-destructive bg-destructive/5 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive text-sm">
                      Double-booking risk · {conflict.propertyName}
                    </p>
                    <p className="mt-0.5 text-muted-foreground text-xs">
                      {conflict.roomType} · via {conflict.channel}
                    </p>
                    <p className="mt-1 text-foreground/80 text-xs">
                      {conflict.description}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="destructive" className="shrink-0">
                  Resolve
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            <ClockIcon className="size-3.5" />
            Live action log
          </p>
          {holds.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No checkout holds in progress.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {holds.map((hold) => (
                <div
                  key={hold.id}
                  className="flex items-center justify-between gap-3 border border-border p-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate">
                      <span className="font-medium">{hold.guestName}</span>{" "}
                      checking out of{" "}
                      <span className="text-muted-foreground">
                        {hold.roomType} - {hold.propertyName}
                      </span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-xs tabular-nums",
                      hold.minutesRemaining <= 5
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {hold.minutesRemaining}m hold remaining
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            <RadioIcon className="size-3.5" />
            OTA sync monitor
          </p>
          <div className="flex flex-col gap-2">
            {heartbeats.map((hb) => (
              <div
                key={hb.channel}
                className="flex items-center justify-between gap-3 border border-border p-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                        hb.status === "active" ? "bg-success" : "bg-amber-500",
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex size-2 rounded-full",
                        hb.status === "active" ? "bg-success" : "bg-amber-500",
                      )}
                    />
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <WifiIcon className="size-3.5 text-muted-foreground" />
                    {hb.channel}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">
                  Active {hb.lastSyncMinutesAgo}m ago · {hb.conflicts} conflict
                  {hb.conflicts === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
