import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import { PhoneInput } from "@propertyos/ui/components/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { cn } from "@propertyos/ui/lib/utils";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { CheckIcon, SearchIcon, UserCheckIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { MIN_LOOKUP_DIGITS, useGuestLookup } from "../api/use-guest-lookup";
import { useOccupancy } from "../api/use-occupancy";
import { useRoomAvailability } from "../api/use-room-availability";
import {
  type BookingSource,
  type DiscountKind,
  priceStay,
} from "../lib/booking";
import { formatBookedRange, formatInr, formatStayRange } from "../lib/format";
import type { BookingProperty } from "../lib/property";
import { StayRangeCalendar } from "./stay-range-calendar";

export type NewBookingInput = {
  propertyId: string;
  roomId: string;
  guest: { name: string; phone: string };
  checkIn: string;
  checkOut: string;
  totalAmountPaise: number;
  source: BookingSource;
};

const SOURCE_LABELS: Record<BookingSource, string> = {
  direct: "Direct",
  manual: "Manual",
  airbnb: "Airbnb",
  booking_com: "Booking.com",
};

const EMPTY_FORM = {
  propertyId: "",
  roomId: "",
  guestName: "",
  guestPhone: "",
  discountValue: "",
  discountKind: "amount" as DiscountKind,
  /** Basis points; 0 means no GST on this booking. */
  gstRateBps: 0,
  gstInclusive: false,
  source: "direct" as BookingSource,
};

/** A calendar day as "YYYY-MM-DD" -- never an ISO instant; see `lib/format`. */
function toDay(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function CreateBookingDialog({
  open,
  properties,
  onOpenChange,
  onCreate,
  isSaving,
}: {
  open: boolean;
  properties: BookingProperty[];
  onOpenChange: (open: boolean) => void;
  onCreate: (input: NewBookingInput) => void;
  isSaving?: boolean;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  // Whether the name field was filled by the lookup rather than typed. A
  // matched guest's name is theirs to correct, but overwriting something
  // already typed by hand would be rude.
  const [nameFromLookup, setNameFromLookup] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  // Check-out is exclusive, so the range's end date is the guest's departure
  // day -- the last night slept is the day before it.
  const checkIn = range?.from ? toDay(range.from) : "";
  const checkOut = range?.to ? toDay(range.to) : "";

  // Shading covers the visible month plus the next, so paging forward does not
  // flash unshaded before the request lands.
  const occupancyWindow = useMemo(
    () => ({
      from: toDay(startOfMonth(month)),
      to: toDay(endOfMonth(addMonths(month, 1))),
    }),
    [month],
  );

  const { data: occupancy, isLoading: loadingOccupancy } = useOccupancy({
    propertyId: form.propertyId,
    from: occupancyWindow.from,
    to: occupancyWindow.to,
  });

  // Phone is a guest's identity within an HQ, so a match here means the
  // booking will attach to an existing profile. Surfaced so the front desk
  // knows they are dealing with a returning guest before they save.
  const { data: lookup, isFetching: lookingUp } = useGuestLookup(
    form.guestPhone,
  );
  const matches = lookup?.data ?? [];

  const typedDigits = form.guestPhone.replace(/\D/g, "");
  const hasSearched = typedDigits.length >= MIN_LOOKUP_DIGITS;

  // The guest whose details are currently in the form, if any. Compared on
  // phone rather than name: two people can share a name, but the phone is the
  // identity the booking will actually resolve against.
  const appliedGuest = matches.find(
    (m) => m.phone.replace(/\D/g, "") === typedDigits,
  );

  /**
   * Fills the form from the matched guest.
   *
   * Applied on a click or Enter rather than the moment a match arrives:
   * silently rewriting a field while someone is still typing is startling, and
   * the phone may pass through a valid-but-wrong number on its way to the
   * right one.
   */
  function applyGuest(match: { name: string; phone: string }) {
    setForm((prev) => ({
      ...prev,
      guestName: match.name,
      guestPhone: match.phone,
    }));
    setNameFromLookup(true);
  }

  // Every room in the property, each carrying the stays that clash with these
  // dates. Booked rooms are shown rather than hidden, so the reason a room
  // cannot be used is visible instead of the room silently disappearing.
  const { data, isLoading: loadingRooms } = useRoomAvailability({
    propertyId: form.propertyId,
    checkIn,
    checkOut,
  });
  const rooms = data?.data ?? [];

  const datesValid = Boolean(checkIn && checkOut && checkOut > checkIn);

  // A room picked before the dates changed may now be double-booked, so a
  // selection that has become unavailable is dropped rather than submitted.
  useEffect(() => {
    if (!form.roomId) return;
    const picked = rooms.find((room) => room.id === form.roomId);
    if (picked && picked.conflicts.length > 0) {
      setForm((prev) => ({ ...prev, roomId: "" }));
    }
  }, [rooms, form.roomId]);

  /** Returns every field to its starting state. */
  function reset() {
    setForm(EMPTY_FORM);
    setNameFromLookup(false);
    setRange(undefined);
    setMonth(startOfMonth(new Date()));
  }

  // Cleared whenever the dialog closes, however it closed. A successful save
  // closes it from the parent by flipping `open`, which never reaches
  // `handleOpenChange` -- without this the next booking would open on the last
  // one's guest, room and dates.
  useEffect(() => {
    if (open) return;
    // The setters are inlined rather than calling `reset`: a function
    // redefined each render would have to be a dependency, and re-running this
    // on every render would clear the form as it is being typed.
    setForm(EMPTY_FORM);
    setNameFromLookup(false);
    setRange(undefined);
    setMonth(startOfMonth(new Date()));
  }, [open]);

  function handleOpenChange(next: boolean) {
    // Only cleared once the dialog is closed for good -- discarding what
    // someone typed mid-request would lose it if the server rejects it.
    if (!next) reset();
    onOpenChange(next);
  }

  const canSave =
    form.propertyId &&
    form.roomId &&
    form.guestName.trim() &&
    form.guestPhone.trim() &&
    datesValid &&
    !isSaving;

  function handleSave() {
    if (!canSave) return;
    onCreate({
      propertyId: form.propertyId,
      roomId: form.roomId,
      guest: { name: form.guestName.trim(), phone: form.guestPhone.trim() },
      checkIn,
      checkOut,
      totalAmountPaise,
      source: form.source,
    });
  }

  const freeCount = rooms.filter((r) => r.conflicts.length === 0).length;

  // What the picked room costs for these dates, from its own nightly rates,
  // less any discount and plus GST if it applies.
  const selectedRoom = rooms.find((r) => r.id === form.roomId);
  const pricing =
    selectedRoom && datesValid
      ? priceStay({
          checkIn,
          checkOut,
          weekdayPrice: selectedRoom.weekdayPrice,
          weekendPrice: selectedRoom.weekendPrice,
          discountValue: form.discountValue,
          discountKind: form.discountKind,
          gstRateBps: form.gstRateBps,
          gstInclusive: form.gstInclusive,
        })
      : null;

  const totalAmountPaise = pricing?.totalPaise ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Booking</DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[70vh] gap-4 overflow-y-auto px-4 pb-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="font-medium text-foreground/80 text-xs">
                Property *
              </span>
              <Select
                value={form.propertyId}
                onValueChange={(v) =>
                  setForm({ ...form, propertyId: v as string, roomId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property">
                    {(value: unknown) =>
                      properties.find((p) => p.id === value)?.name ??
                      "Select property"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground/80 text-xs">
                  Stay dates *
                </span>
                {datesValid && (
                  <span className="text-[11px] text-foreground/70">
                    {formatStayRange(checkIn, checkOut)}
                  </span>
                )}
              </div>

              <StayRangeCalendar
                value={range}
                onChange={(next) => {
                  setRange(next);
                  // The chosen room may not survive a change of dates.
                  setForm((prev) => ({ ...prev, roomId: "" }));
                }}
                nights={occupancy?.data?.nights ?? []}
                totalRooms={occupancy?.data?.totalRooms ?? 0}
                month={month}
                onMonthChange={setMonth}
                isLoading={loadingOccupancy}
                disabled={!form.propertyId}
              />

              {!form.propertyId && (
                <p className="text-[11px] text-foreground/70">
                  Pick a property first to see availability.
                </p>
              )}
              {range?.from && !range.to && (
                <p className="text-[11px] text-foreground/70">
                  Now pick the check-out date.
                </p>
              )}
            </div>

            {hasSearched && (
              <div className="flex flex-col gap-1 border bg-muted/20 p-1.5">
                {lookingUp ? (
                  <p className="flex items-center gap-2 px-1.5 py-1 text-foreground/70 text-xs">
                    <SearchIcon className="size-3.5 shrink-0" />
                    Searching guests...
                  </p>
                ) : matches.length === 0 ? (
                  <p className="flex items-center gap-2 px-1.5 py-1 text-foreground/70 text-xs">
                    <SearchIcon className="size-3.5 shrink-0" />
                    New guest — a profile will be created on save.
                  </p>
                ) : (
                  <>
                    <p className="px-1.5 py-1 text-[11px] text-foreground/70">
                      {matches.length === 1
                        ? "1 matching guest"
                        : `${matches.length} matching guests`}{" "}
                      — pick one to fill their details
                    </p>
                    {matches.map((match) => {
                      const isApplied = appliedGuest?.id === match.id;
                      return (
                        <button
                          key={match.id}
                          type="button"
                          onClick={() => applyGuest(match)}
                          className={cn(
                            "flex items-center justify-between gap-3 border px-2.5 py-1.5 text-left text-xs transition-colors",
                            isApplied
                              ? "border-success/50 bg-success/10"
                              : "border-transparent hover:bg-muted",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{match.name}</p>
                            <p className="text-[11px] text-foreground/70">
                              {match.phone} · {match.totalStays}{" "}
                              {match.totalStays === 1 ? "stay" : "stays"} ·{" "}
                              {formatInr(match.totalSpentPaise)}
                            </p>
                          </div>
                          {isApplied ? (
                            <span className="flex shrink-0 items-center gap-1 text-[11px] text-success">
                              <CheckIcon className="size-3" />
                              Selected
                            </span>
                          ) : (
                            <UserCheckIcon className="size-3.5 shrink-0 text-foreground/50" />
                          )}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-foreground/80 text-xs">
                  Guest Name *
                </span>
                <Input
                  value={form.guestName}
                  onChange={(e) =>
                    setForm({ ...form, guestName: e.target.value })
                  }
                  placeholder="Full name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-foreground/80 text-xs">
                  Phone *
                </span>
                <PhoneInput
                  value={form.guestPhone}
                  onKeyDown={(e) => {
                    // Enter takes the only match rather than submitting the
                    // dialog -- what someone typing a number they know is
                    // reaching for. With several matches it would be a guess,
                    // so the list stays the way to choose.
                    const only = matches.length === 1 ? matches[0] : undefined;
                    if (e.key === "Enter" && only && !appliedGuest) {
                      e.preventDefault();
                      applyGuest(only);
                    }
                  }}
                  onChange={(value) => {
                    // A different number is a different person, so a name this
                    // dialog filled in is no longer theirs to keep.
                    setForm((prev) => ({
                      ...prev,
                      guestPhone: value,
                      guestName: nameFromLookup ? "" : prev.guestName,
                    }));
                    setNameFromLookup(false);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-medium text-foreground/80 text-xs">
                Source
              </span>
              <Select
                value={form.source}
                onValueChange={(v) =>
                  setForm({ ...form, source: v as BookingSource })
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value: unknown) =>
                      SOURCE_LABELS[value as BookingSource] ?? "Direct"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="booking_com">Booking.com</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {" "}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground/80 text-xs">
                  Room *
                </span>
                {form.propertyId && datesValid && !loadingRooms && (
                  <span className="text-[11px] text-foreground/70">
                    {freeCount} of {rooms.length} available
                  </span>
                )}
              </div>

              {!form.propertyId || !datesValid ? (
                <p className="border border-dashed px-3 py-4 text-center text-foreground/70 text-xs">
                  Pick a property and dates to see rooms.
                </p>
              ) : loadingRooms ? (
                <p className="border border-dashed px-3 py-4 text-center text-foreground/70 text-xs">
                  Checking availability...
                </p>
              ) : rooms.length === 0 ? (
                <p className="border border-dashed px-3 py-4 text-center text-foreground/70 text-xs">
                  This property has no rooms yet.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {rooms.map((room) => {
                    const isBooked = room.conflicts.length > 0;
                    const isSelected = form.roomId === room.id;

                    return (
                      <button
                        key={room.id}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setForm({ ...form, roomId: room.id })}
                        className={cn(
                          "flex items-start justify-between gap-3 border px-2.5 py-2 text-left text-xs transition-colors",
                          isBooked
                            ? "cursor-not-allowed bg-muted/30 opacity-70"
                            : "hover:bg-muted/40",
                          isSelected && "border-primary bg-primary/5",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{room.name}</p>
                          <p className="text-[11px] text-foreground/70">
                            {room.roomType.replace("_", " ")} · up to{" "}
                            {room.maxGuests} · ₹{room.weekdayPrice}
                            {room.weekendPrice !== room.weekdayPrice &&
                              ` / ₹${room.weekendPrice} wknd`}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          {isBooked ? (
                            <>
                              <p className="font-medium text-destructive">
                                Already booked
                              </p>
                              <p className="text-[11px] text-foreground/70">
                                {room.conflicts
                                  .map((c) =>
                                    formatBookedRange(c.checkIn, c.checkOut),
                                  )
                                  .join(", ")}
                              </p>
                            </>
                          ) : isSelected ? (
                            <span className="flex items-center gap-1 text-primary">
                              <CheckIcon className="size-3.5" />
                              Selected
                            </span>
                          ) : (
                            <span className="text-foreground/70">
                              Available
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-medium text-foreground/80 text-xs">
                Price
              </span>

              {pricing ? (
                <div className="flex flex-col gap-1.5 border bg-muted/30 p-2.5 text-xs">
                  <div className="flex items-baseline justify-between text-foreground/70">
                    <span>
                      {pricing.nights}{" "}
                      {pricing.nights === 1 ? "night" : "nights"}
                      {pricing.weekendNights > 0 &&
                        ` (${pricing.weekendNights} wknd)`}
                    </span>
                    <span className="tabular-nums">
                      {formatInr(pricing.subtotalPaise)}
                    </span>
                  </div>

                  {pricing.discountPaise > 0 && (
                    <div className="flex items-baseline justify-between text-success">
                      <span>Discount</span>
                      <span className="tabular-nums">
                        -{formatInr(pricing.discountPaise)}
                      </span>
                    </div>
                  )}

                  {pricing.gstPaise > 0 && (
                    <div className="flex items-baseline justify-between text-foreground/70">
                      <span>
                        GST {form.gstRateBps / 100}%
                        {form.gstInclusive && " (incl.)"}
                      </span>
                      <span className="tabular-nums">
                        {formatInr(pricing.gstPaise)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between border-t pt-1.5 font-medium text-sm">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {formatInr(pricing.totalPaise)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="border border-dashed px-2.5 py-4 text-center text-foreground/70 text-xs">
                  Pick a room and dates to price the stay
                </p>
              )}

              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: e.target.value })
                  }
                  placeholder="Discount"
                  className="h-7 text-xs"
                />
                {/* A discount, never an override: the room's own rates stay
                    visible and the reduction is its own auditable line. */}
                <Select
                  value={form.discountKind}
                  onValueChange={(v) =>
                    setForm({ ...form, discountKind: v as DiscountKind })
                  }
                >
                  <SelectTrigger className="h-7 w-20 text-xs">
                    <SelectValue>
                      {(value: unknown) => (value === "percent" ? "%" : "₹")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">₹</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <Select
                  value={String(form.gstRateBps)}
                  onValueChange={(v) =>
                    setForm({ ...form, gstRateBps: Number(v) })
                  }
                >
                  <SelectTrigger className="h-7 flex-1 text-xs">
                    <SelectValue>
                      {(value: unknown) =>
                        Number(value) === 0
                          ? "No GST"
                          : `GST ${Number(value) / 100}%`
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No GST</SelectItem>
                    <SelectItem value="500">GST 5%</SelectItem>
                    <SelectItem value="1200">GST 12%</SelectItem>
                    <SelectItem value="1800">GST 18%</SelectItem>
                    <SelectItem value="2800">GST 28%</SelectItem>
                  </SelectContent>
                </Select>

                {form.gstRateBps > 0 && (
                  <Select
                    value={form.gstInclusive ? "inclusive" : "exclusive"}
                    onValueChange={(v) =>
                      setForm({ ...form, gstInclusive: v === "inclusive" })
                    }
                  >
                    <SelectTrigger className="h-7 w-28 text-xs">
                      <SelectValue>
                        {(value: unknown) =>
                          value === "inclusive" ? "Included" : "Added on"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exclusive">Added on</SelectItem>
                      <SelectItem value="inclusive">Included</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isSaving}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
