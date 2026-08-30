import { Button } from "@propertyos/ui/components/button";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import {
  DataTable,
  DataTableContainer,
} from "@propertyos/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@propertyos/ui/components/dropdown-menu";
import { cn } from "@propertyos/ui/lib/utils";
import { MoreHorizontalIcon } from "lucide-react";
import type { Booking } from "../lib/booking";
import { formatInr, formatStayRange } from "../lib/format";
import { SourceBadge } from "./source-badge";
import { StatusPill } from "./status-pill";

export type BookingAction =
  | "confirm"
  | "check_in"
  | "check_out"
  | "collect"
  | "timeline"
  | "cancel";

type MenuAction = {
  action: BookingAction;
  label: string;
  destructive?: boolean;
};

/**
 * The actions offered for a booking, mirroring the transitions the server
 * allows. A block has no guest lifecycle, so it offers none of them.
 */
function contextActions(booking: Booking): MenuAction[] {
  if (booking.kind === "block") {
    return [{ action: "cancel", label: "Remove Block", destructive: true }];
  }

  const actions: MenuAction[] = [];

  if (booking.status === "pending") {
    actions.push({ action: "confirm", label: "Confirm" });
  }
  if (booking.status === "pending" || booking.status === "confirmed") {
    actions.push({ action: "check_in", label: "Check In" });
  }
  if (booking.status === "checked_in") {
    actions.push({ action: "check_out", label: "Check Out" });
  }
  if (booking.balanceDuePaise > 0 && booking.status !== "cancelled") {
    actions.push({ action: "collect", label: "Collect Payment" });
  }

  actions.push({ action: "timeline", label: "View Timeline" });

  if (booking.status !== "cancelled" && booking.status !== "checked_out") {
    actions.push({
      action: "cancel",
      label: "Cancel Booking",
      destructive: true,
    });
  }

  return actions;
}

export function BookingsTable({
  bookings,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenAudit,
  onOpenSettle,
  onAction,
  isLoading,
}: {
  bookings: Booking[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenAudit: (booking: Booking) => void;
  onOpenSettle: (booking: Booking) => void;
  onAction: (action: BookingAction, booking: Booking) => void;
  isLoading?: boolean;
}) {
  const allSelected =
    bookings.length > 0 && selectedIds.size === bookings.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 border py-16 text-center">
        <p className="text-muted-foreground text-sm">Loading bookings...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 border py-16 text-center">
        <p className="text-sm">No bookings match your filters</p>
        <p className="text-muted-foreground text-xs">
          Try adjusting search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <DataTableContainer>
      <DataTable>
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="w-10 px-3 py-2.5">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
              />
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Ref
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Guest
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Property / Room
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Dates (Nights)
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Source
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Tariff
            </th>
            <th className="w-10 px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const due = booking.balanceDuePaise;
            const isSelected = selectedIds.has(booking.id);
            return (
              <tr
                key={booking.id}
                className={cn(
                  "border-b transition-colors last:border-b-0 hover:bg-muted/30",
                  isSelected && "bg-muted/40",
                )}
              >
                <td className="px-3 py-2.5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(booking.id)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenAudit(booking)}
                    className="font-display font-medium text-foreground hover:underline"
                  >
                    {booking.ref}
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  {/* A block occupies a room on nobody's behalf, so it shows
                      why the room is out rather than an absent guest. */}
                  <p className="font-medium">
                    {booking.kind === "block"
                      ? (booking.blockReason?.replace("_", " ") ?? "Blocked")
                      : (booking.guestName ?? "—")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {booking.kind === "block"
                      ? "Room block"
                      : (booking.guestPhone ?? "")}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <p>{booking.propertyName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {booking.roomName}
                  </p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                  {formatStayRange(booking.checkIn, booking.checkOut)}
                </td>
                <td className="px-3 py-2.5">
                  <SourceBadge source={booking.source} />
                </td>
                <td className="px-3 py-2.5">
                  <StatusPill status={booking.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                  <p>{formatInr(booking.amountPaidPaise)} Paid</p>
                  {due > 0 && (
                    <p className="text-[11px] text-warning">
                      {formatInr(due)} Due
                    </p>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {contextActions(booking).map((item) => (
                        <DropdownMenuItem
                          key={item.action}
                          variant={item.destructive ? "destructive" : "default"}
                          onClick={() => {
                            if (item.action === "collect") {
                              onOpenSettle(booking);
                            } else if (item.action === "timeline") {
                              onOpenAudit(booking);
                            } else {
                              onAction(item.action, booking);
                            }
                          }}
                        >
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </DataTableContainer>
  );
}
