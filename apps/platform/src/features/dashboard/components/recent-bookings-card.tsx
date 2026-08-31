import { Button } from "@propertyos/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { cn } from "@propertyos/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  IndianRupeeIcon,
  LogInIcon,
  LogOutIcon,
  PhoneIcon,
} from "lucide-react";
import { useState } from "react";

import { useChangeBookingStatus } from "@/features/bookings/api/use-change-booking-status";
import { useRecordBookingPayment } from "@/features/bookings/api/use-record-booking-payment";
import { SettlePaymentSheet } from "@/features/bookings/components/settle-payment-sheet";
import { StayDateDialog } from "@/features/bookings/components/stay-date-dialog";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { formatDayLabel, formatPaise } from "../lib/format";

export type RecentBookingRow = {
  id: string;
  ref: string;
  organizationId: string;
  propertyName: string;
  roomName: string;
  guestName: string | null;
  guestPhone: string | null;
  status: string;
  source: string;
  checkIn: string;
  checkOut: string;
  actualCheckIn: string | null;
  actualCheckOut: string | null;
  guestCount: number;
  totalAmountPaise: number;
  paidPaise: number;
  balanceDuePaise: number;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  checked_out: "Checked out",
  cancelled: "Cancelled",
};

/**
 * The one action a booking can move to next, from its current status.
 *
 * Mirrors `ALLOWED_TRANSITIONS` on the server, which is what actually enforces
 * this -- offering only the legal next step keeps the desk from having to know
 * the lifecycle. A pending booking can also be confirmed first, but checking a
 * guest in is the action somebody standing at the desk actually wants, and the
 * server allows pending -> checked_in directly.
 */
/**
 * The slice of a booking `StayDateDialog` actually reads. Kept explicit so a
 * new field in the dialog fails to compile here rather than at runtime.
 */
type StayDateBooking = Pick<
  RecentBookingRow,
  | "id"
  | "ref"
  | "checkIn"
  | "checkOut"
  | "actualCheckIn"
  | "guestName"
  | "roomName"
>;

/** The slice `SettlePaymentSheet` reads. */
type SettleBooking = Pick<RecentBookingRow, "id" | "ref" | "guestName"> & {
  balanceDuePaise: number;
};

type NextAction = {
  status: "confirmed" | "checked_in" | "checked_out";
  label: string;
  icon: typeof LogInIcon | null;
};

function nextAction(status: string): NextAction | undefined {
  if (status === "pending") {
    return { status: "confirmed", label: "Confirm", icon: null } as const;
  }
  if (status === "confirmed") {
    return {
      status: "checked_in",
      label: "Check in",
      icon: LogInIcon,
    } as const;
  }
  if (status === "checked_in") {
    return {
      status: "checked_out",
      label: "Check out",
      icon: LogOutIcon,
    } as const;
  }
  return undefined;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
        status === "checked_in" &&
          "border border-success/30 bg-success/10 text-success",
        status === "confirmed" && "border border-border text-muted-foreground",
        status === "pending" &&
          "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/**
 * The next few live bookings, with the one button each of them needs.
 *
 * Replaces a tabbed board that sorted stays into due-in/due-out/upcoming: the
 * buckets depended on date arithmetic that was easy to get wrong and hard to
 * see wrong, where a flat list ordered by arrival is legible on sight.
 */
export function RecentBookingsCard({
  rows,
  showFinance,
  showProperty,
  onChanged,
}: {
  rows: RecentBookingRow[] | undefined;
  showFinance: boolean;
  showProperty: boolean;
  onChanged: () => void;
}) {
  const changeStatus = useChangeBookingStatus();
  const recordPayment = useRecordBookingPayment();
  const feedback = useFeedback();

  const [settleBooking, setSettleBooking] = useState<SettleBooking | null>(
    null,
  );

  // Arrival and departure carry a date, so they go through the same dialog the
  // bookings page uses -- an early check-in or check-out records the day it
  // actually happened, which is what availability reads. Mutating straight to
  // `checked_in` here would silently stamp today and lose that.
  // The dialog reads only these five fields off a booking, all of which this
  // card's rows carry. Typed as that subset rather than as a full `Booking`,
  // so the compiler checks the contract instead of a cast hiding it.
  const [stayDate, setStayDate] = useState<{
    booking: StayDateBooking;
    mode: "checked_in" | "checked_out";
  } | null>(null);

  const act = (row: RecentBookingRow, action: NextAction) => {
    if (action.status === "checked_in" || action.status === "checked_out") {
      setStayDate({ booking: row, mode: action.status });
      return;
    }

    // Confirming carries no date, so it goes straight through.
    changeStatus.mutate(
      { param: { id: row.id }, json: { status: action.status } },
      {
        onSuccess: () => {
          onChanged();
          feedback.success("Booking updated", `${row.ref} is now confirmed.`);
        },
        onError: (error) =>
          feedback.error(
            "Couldn't update booking",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          ),
      },
    );
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base">Bookings</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {!rows || rows.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-xs">
            No live bookings right now.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row) => {
              const action = nextAction(row.status);
              const ActionIcon = action?.icon;

              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-sm">
                        {row.guestName ?? "Guest"}
                      </p>
                      <StatusBadge status={row.status} />
                    </div>

                    {row.guestPhone && (
                      <a
                        href={`tel:${row.guestPhone}`}
                        className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
                      >
                        <PhoneIcon className="size-3" />
                        {row.guestPhone}
                      </a>
                    )}

                    <p className="mt-0.5 truncate text-muted-foreground text-xs">
                      {formatDayLabel(row.checkIn, "day")} →{" "}
                      {formatDayLabel(row.checkOut, "day")}
                    </p>

                    <p className="mt-0.5 truncate text-muted-foreground text-xs">
                      {showProperty && `${row.propertyName} · `}
                      {row.roomName} · {row.ref}
                      {showFinance && ` · ${formatPaise(row.totalAmountPaise)}`}
                    </p>

                    {showFinance && row.balanceDuePaise > 0 && (
                      <p className="mt-0.5 text-destructive text-xs">
                        {/* Unpaid and part-paid both settle the same way, but
                            they are different situations at the desk, so the
                            row says which one it is. */}
                        {row.paidPaise > 0
                          ? `${formatPaise(row.paidPaise)} paid · ${formatPaise(row.balanceDuePaise)} still due`
                          : `${formatPaise(row.balanceDuePaise)} unpaid`}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {showFinance && row.balanceDuePaise > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={recordPayment.isPending}
                        onClick={() => setSettleBooking(row)}
                      >
                        <IndianRupeeIcon />
                        Settle
                      </Button>
                    )}
                    {action && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={changeStatus.isPending}
                        onClick={() => act(row, action)}
                      >
                        {ActionIcon && <ActionIcon />}
                        {action.label}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <div className="border-t p-3">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          render={<Link to="/bookings" />}
        >
          Open bookings
        </Button>
      </div>

      <SettlePaymentSheet
        booking={settleBooking}
        onOpenChange={(open) => !open && setSettleBooking(null)}
        isSaving={recordPayment.isPending}
        onSettled={({ bookingId, amountPaise, method, paidAt }) => {
          recordPayment.mutate(
            { param: { id: bookingId }, json: { amountPaise, method, paidAt } },
            {
              onSuccess: () => {
                onChanged();
                setSettleBooking(null);
                feedback.success("Payment recorded", "The balance is updated.");
              },
              onError: (error) =>
                feedback.error(
                  "Couldn't record payment",
                  getApiErrorMessage(error, "Something went wrong. Try again."),
                ),
            },
          );
        }}
      />

      {stayDate && (
        <StayDateDialog
          booking={stayDate.booking}
          mode={stayDate.mode}
          isSaving={changeStatus.isPending}
          onOpenChange={(open) => !open && setStayDate(null)}
          onConfirm={(effectiveDate) => {
            changeStatus.mutate(
              {
                param: { id: stayDate.booking.id },
                json: { status: stayDate.mode, effectiveDate },
              },
              {
                onSuccess: () => {
                  onChanged();
                  setStayDate(null);
                  feedback.success(
                    "Booking updated",
                    `${stayDate.booking.ref} is now ${
                      stayDate.mode === "checked_in"
                        ? "checked in"
                        : "checked out"
                    }.`,
                  );
                },
                onError: (error) =>
                  feedback.error(
                    "Couldn't update booking",
                    getApiErrorMessage(
                      error,
                      "Something went wrong. Try again.",
                    ),
                  ),
              },
            );
          }}
        />
      )}
    </Card>
  );
}
