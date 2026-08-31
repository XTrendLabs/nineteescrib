import { cn } from "@propertyos/ui/lib/utils";
import { HomeIcon, ZapIcon } from "lucide-react";
import type { CalendarBooking as Booking } from "../lib/calendar";

/**
 * Colour by where the stay has got to.
 *
 * Green for a completed stay, amber while the guest is in the room, red for a
 * cancellation. Upcoming stays are deliberately absent: they fall through to
 * the source shading, so the grid still tells direct from OTA at a glance for
 * everything that has not happened yet.
 */
const STATUS_CLASSES: Partial<Record<Booking["status"], string>> = {
  checked_out: "border-success/50 bg-success/25 text-foreground",
  checked_in: "border-warning/60 bg-warning/40 text-foreground",
  cancelled: "border-destructive/50 bg-destructive/20 text-foreground",
};

const STATUS_MARK: Partial<Record<Booking["status"], string>> = {
  checked_out: "✓",
  checked_in: "●",
  cancelled: "✕",
};

/** Channels get a mark; a booking taken by hand or on the site does not. */
const SOURCE_ICON: Record<Booking["source"], typeof HomeIcon | null> = {
  direct: null,
  manual: null,
  airbnb: HomeIcon,
  booking_com: ZapIcon,
};

export function BookingBlock({
  booking,
  className,
  onPointerDownDrag,
  style,
}: {
  booking: Booking;
  className?: string;
  onPointerDownDrag?: (e: React.PointerEvent) => void;
  style?: React.CSSProperties;
}) {
  if (booking.kind === "blocked") {
    const label =
      booking.blockReason === "owner_stay" ? "Owner Stay" : "Maintenance";
    return (
      <div
        style={style}
        className={cn(
          "flex h-full items-center overflow-hidden border border-neutral-400 bg-[repeating-linear-gradient(45deg,var(--pattern-color)_0,var(--pattern-color)_2px,transparent_2px,transparent_8px)] px-1.5 text-[10px] text-neutral-700 [--pattern-color:var(--color-neutral-200)] dark:border-neutral-600 dark:text-neutral-300 dark:[--pattern-color:var(--color-neutral-700)]",
          className,
        )}
      >
        <span className="truncate font-medium">{label}</span>
      </div>
    );
  }

  if (booking.kind === "checkout_hold") {
    return (
      <div
        style={style}
        className={cn(
          "flex h-full items-center overflow-hidden border-2 border-neutral-400 border-dashed bg-neutral-100 px-1.5 text-[10px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
          className,
        )}
      >
        <span className="truncate font-medium">
          Pending Hold · {booking.holdMinutesRemaining}m
        </span>
      </div>
    );
  }

  const isDirect = booking.source === "direct";
  const SourceIcon = SOURCE_ICON[booking.source];
  const isSettled =
    booking.status === "checked_out" || booking.status === "cancelled";

  return (
    <button
      type="button"
      style={style}
      onPointerDown={onPointerDownDrag}
      className={cn(
        "flex h-full w-full items-center gap-1 overflow-hidden border px-1.5 text-left text-[10px]",
        STATUS_CLASSES[booking.status] ??
          // An upcoming stay carries no status colour of its own, so it keeps
          // the source shading that distinguishes direct from OTA.
          (isDirect
            ? "border-transparent bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "border-transparent bg-neutral-600 text-white dark:bg-neutral-500"),
        // A finished stay has nothing left to reschedule.
        isSettled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      {SourceIcon && !isSettled && (
        <SourceIcon className="size-2.5 shrink-0 opacity-80" />
      )}
      <span
        className={cn(
          "truncate font-medium",
          booking.status === "cancelled" && "line-through",
        )}
      >
        {booking.guestName}
      </span>
      {STATUS_MARK[booking.status] && (
        <span className="ml-auto shrink-0 opacity-70">
          {STATUS_MARK[booking.status]}
        </span>
      )}
    </button>
  );
}
