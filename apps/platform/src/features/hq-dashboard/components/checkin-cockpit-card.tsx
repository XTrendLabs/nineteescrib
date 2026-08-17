import { Button } from "@propertyos/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { cn } from "@propertyos/ui/lib/utils";
import {
  KeyRoundIcon,
  LogInIcon,
  LogOutIcon,
  MessageSquareIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

import type {
  BookingSource,
  MockProperty,
  PaymentStatus,
} from "../lib/mock-data";
import { buildArrivals, buildDepartures } from "../lib/mock-data";

type CockpitTab = "arrivals" | "departures";

const SOURCE_LABEL: Record<BookingSource, string> = {
  direct: "Direct",
  airbnb: "Airbnb",
  booking_com: "Booking.com",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
};

function SourceBadge({ source }: { source: BookingSource }) {
  return (
    <span className="border px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase tracking-wide">
      {SOURCE_LABEL[source]}
    </span>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
        status === "paid" &&
          "border border-success/30 bg-success/10 text-success",
        status === "partial" &&
          "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        status === "unpaid" &&
          "border border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {PAYMENT_LABEL[status]}
    </span>
  );
}

export function CheckinCockpitCard({
  properties,
}: {
  properties: MockProperty[];
}) {
  const [tab, setTab] = useState<CockpitTab>("arrivals");

  const arrivals = useMemo(() => buildArrivals(properties), [properties]);
  const departures = useMemo(() => buildDepartures(properties), [properties]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base">Live check-in cockpit</CardTitle>
        <CardAction>
          <div className="flex items-center border">
            <button
              type="button"
              onClick={() => setTab("arrivals")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors",
                tab === "arrivals"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <LogInIcon className="size-3.5" />
              Arrivals
            </button>
            <button
              type="button"
              onClick={() => setTab("departures")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors",
                tab === "departures"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <LogOutIcon className="size-3.5" />
              Departures
            </button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        <AnimatePresence mode="wait">
          {tab === "arrivals" ? (
            <motion.div
              key="arrivals"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="flex max-h-96 flex-col gap-2 overflow-y-auto"
            >
              {arrivals.map((row) => {
                const highlight = row.isToday && row.paymentStatus !== "paid";
                return (
                  <div
                    key={row.id}
                    className={cn(
                      "flex items-center justify-between gap-3 border p-2.5",
                      highlight
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="w-12 shrink-0 text-muted-foreground text-xs tabular-nums">
                        {row.time}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">
                          {row.guestName}
                        </p>
                        <p className="truncate text-muted-foreground text-xs">
                          {row.propertyName} · {row.roomType}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <SourceBadge source={row.source} />
                      <PaymentBadge status={row.paymentStatus} />
                      <Button size="sm" variant="outline">
                        Check in
                      </Button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="departures"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="flex max-h-96 flex-col gap-2 overflow-y-auto"
            >
              {departures.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 border border-border p-2.5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="w-12 shrink-0 text-muted-foreground text-xs tabular-nums">
                      {row.time}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">
                        {row.guestName}
                      </p>
                      <p className="truncate text-muted-foreground text-xs">
                        {row.propertyName} · {row.roomType}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[10px] uppercase tracking-wide",
                        row.keysReturned
                          ? "text-success"
                          : "text-muted-foreground",
                      )}
                    >
                      <KeyRoundIcon className="size-3" />
                      {row.keysReturned ? "Keys in" : "Keys pending"}
                    </span>
                    <Button size="sm" variant="outline">
                      <MessageSquareIcon className="size-3.5" />
                      Check out & review
                    </Button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
