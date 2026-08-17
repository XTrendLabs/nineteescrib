import { cn } from "@propertyos/ui/lib/utils";
import { HomeIcon, ZapIcon } from "lucide-react";
import type { Booking } from "../lib/mock-data";

const SOURCE_ICON = {
  direct: null,
  airbnb: HomeIcon,
  booking_com: ZapIcon,
} as const;

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

  return (
    <button
      type="button"
      style={style}
      onPointerDown={onPointerDownDrag}
      className={cn(
        "flex h-full cursor-grab items-center gap-1 overflow-hidden px-1.5 text-left text-[10px] active:cursor-grabbing",
        isDirect
          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "bg-neutral-600 text-white dark:bg-neutral-500",
        className,
      )}
    >
      {SourceIcon && <SourceIcon className="size-2.5 shrink-0 opacity-80" />}
      <span className="truncate font-medium">{booking.guestName}</span>
    </button>
  );
}
