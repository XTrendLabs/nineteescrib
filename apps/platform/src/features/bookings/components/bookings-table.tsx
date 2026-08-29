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
import { formatInr, formatStayRange } from "../lib/format";
import type { Booking } from "../lib/mock-data";
import { SourceBadge } from "./source-badge";
import { StatusPill } from "./status-pill";

function contextActions(booking: Booking) {
  const actions: {
    label: string;
    onSelect: () => void;
    destructive?: boolean;
  }[] = [];
  if (booking.status === "confirmed") {
    actions.push({ label: "Check In", onSelect: () => {} });
  }
  if (booking.status === "checked_in") {
    actions.push({ label: "Check Out", onSelect: () => {} });
  }
  if (
    booking.paidPaise < booking.totalPaise &&
    booking.status !== "cancelled"
  ) {
    actions.push({ label: "Collect Payment", onSelect: () => {} });
  }
  actions.push({ label: "View Timeline", onSelect: () => {} });
  if (booking.status !== "cancelled" && booking.status !== "checked_out") {
    actions.push({
      label: "Cancel Booking",
      onSelect: () => {},
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
}: {
  bookings: Booking[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenAudit: (booking: Booking) => void;
  onOpenSettle: (booking: Booking) => void;
}) {
  const allSelected =
    bookings.length > 0 && selectedIds.size === bookings.length;

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
            const due = booking.totalPaise - booking.paidPaise;
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
                  <p className="font-medium">{booking.guestName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {booking.guestPhone}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <p>{booking.propertyName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {booking.roomType}
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
                  <p>{formatInr(booking.paidPaise)} Paid</p>
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
                      {contextActions(booking).map((action) => (
                        <DropdownMenuItem
                          key={action.label}
                          variant={
                            action.destructive ? "destructive" : "default"
                          }
                          onClick={() => {
                            if (action.label === "Collect Payment") {
                              onOpenSettle(booking);
                            } else if (action.label === "View Timeline") {
                              onOpenAudit(booking);
                            } else {
                              action.onSelect();
                            }
                          }}
                        >
                          {action.label}
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
