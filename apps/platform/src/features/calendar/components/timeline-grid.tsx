import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@propertyos/ui/components/popover";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { cn } from "@propertyos/ui/lib/utils";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isToday,
  isWeekend,
} from "date-fns";
import { useMemo, useRef, useState } from "react";

import type { Booking, PropertyInventory, Unit } from "../lib/mock-data";
import { hasConflict } from "../lib/mock-data";
import { BookingBlock } from "./booking-block";
import { BookingQuickView } from "./booking-popover";
import type { DrawerSelection } from "./quick-create-drawer";
import type { CalendarView } from "./view-toggle";

const CELL_WIDTH = 88;
const ROW_HEIGHT = 36;
const LABEL_WIDTH = 208;

type DragSelection = {
  unitId: string;
  startDayIndex: number;
  endDayIndex: number;
};

type DraggingBooking = {
  booking: Booking;
  sourceUnitId: string;
  currentUnitId: string;
};

export function TimelineGrid({
  inventory,
  bookings,
  onBookingsChange,
  days,
  view,
  onRequestCreate,
}: {
  inventory: PropertyInventory[];
  bookings: Booking[];
  onBookingsChange: (next: Booking[]) => void;
  days: Date[];
  view: CalendarView;
  onRequestCreate: (selection: DrawerSelection) => void;
}) {
  const feedback = useFeedback();

  const [dragSelection, setDragSelection] = useState<DragSelection | null>(
    null,
  );
  const dragStartRef = useRef<{ unitId: string; dayIndex: number } | null>(
    null,
  );

  const [draggingBooking, setDraggingBooking] =
    useState<DraggingBooking | null>(null);
  const draggingRef = useRef<DraggingBooking | null>(null);

  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);

  const allUnits = useMemo(
    () => inventory.flatMap((p) => p.roomTypes.flatMap((rt) => rt.units)),
    [inventory],
  );

  const unitById = useMemo(() => {
    const map = new Map<string, Unit>();
    for (const unit of allUnits) {
      map.set(unit.id, unit);
    }
    return map;
  }, [allUnits]);

  function bookingsForUnit(unitId: string) {
    return bookings.filter((b) => b.unitId === unitId);
  }

  function handleCellPointerDown(unitId: string, dayIndex: number) {
    dragStartRef.current = { unitId, dayIndex };
    setDragSelection({
      unitId,
      startDayIndex: dayIndex,
      endDayIndex: dayIndex,
    });
  }

  function handleCellPointerEnter(unitId: string, dayIndex: number) {
    const start = dragStartRef.current;
    if (start && start.unitId === unitId) {
      setDragSelection({
        unitId,
        startDayIndex: start.dayIndex,
        endDayIndex: dayIndex,
      });
    }

    // Room-swap drag only "arms" once the pointer actually leaves the
    // booking's original row — a plain click (no row change) should just
    // open the popover, not attempt a same-unit swap.
    if (draggingRef.current && draggingRef.current.currentUnitId !== unitId) {
      draggingRef.current = { ...draggingRef.current, currentUnitId: unitId };
      setDraggingBooking(draggingRef.current);
    }
  }

  function handleGridPointerUp() {
    if (dragStartRef.current && dragSelection) {
      const unit = unitById.get(dragSelection.unitId);
      if (unit) {
        const lo = Math.min(
          dragSelection.startDayIndex,
          dragSelection.endDayIndex,
        );
        const hi = Math.max(
          dragSelection.startDayIndex,
          dragSelection.endDayIndex,
        );
        const checkIn = days[lo];
        const checkOut = addDays(days[hi], 1);
        if (checkIn && checkOut) {
          onRequestCreate({
            unitLabel: unit.label,
            roomType: unit.roomType,
            checkIn,
            checkOut,
          });
        }
      }
    }
    dragStartRef.current = null;
    setDragSelection(null);

    if (draggingRef.current) {
      commitRoomSwap(draggingRef.current);
      draggingRef.current = null;
      setDraggingBooking(null);
    }
  }

  function commitRoomSwap(drag: DraggingBooking) {
    if (drag.currentUnitId === drag.sourceUnitId) {
      return;
    }
    const conflict = hasConflict(
      bookings,
      drag.currentUnitId,
      drag.booking.checkIn,
      drag.booking.checkOut,
      drag.booking.id,
    );
    if (conflict) {
      feedback.error(
        "Move blocked",
        "The target unit already has a booking for these dates.",
      );
      return;
    }
    onBookingsChange(
      bookings.map((b) =>
        b.id === drag.booking.id ? { ...b, unitId: drag.currentUnitId } : b,
      ),
    );
    const targetUnit = unitById.get(drag.currentUnitId);
    feedback.success(
      "Booking moved",
      targetUnit
        ? `${drag.booking.guestName} moved to ${targetUnit.label}.`
        : undefined,
    );
  }

  function startBookingDrag(e: React.PointerEvent, booking: Booking) {
    e.stopPropagation();
    const next: DraggingBooking = {
      booking,
      sourceUnitId: booking.unitId,
      currentUnitId: booking.unitId,
    };
    draggingRef.current = next;
    setDraggingBooking(next);
  }

  const gridTemplateColumns = `${LABEL_WIDTH}px repeat(${days.length}, ${CELL_WIDTH}px)`;

  return (
    <div
      className="max-h-[70vh] overflow-auto border"
      onPointerUp={handleGridPointerUp}
      onPointerLeave={() => {
        dragStartRef.current = null;
        setDragSelection(null);
      }}
    >
      <div
        className="min-w-max"
        style={{ display: "grid", gridTemplateColumns }}
      >
        {/* Header row: date columns */}
        <div className="sticky top-0 left-0 z-30 border-r border-b bg-muted/50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "sticky top-0 z-20 flex flex-col items-center justify-center border-r border-b bg-muted/50 py-1 text-[10px]",
              isWeekend(day) && "bg-neutral-100 dark:bg-neutral-800/60",
              isToday(day) && "relative",
            )}
          >
            <span className="text-muted-foreground">{format(day, "EEE")}</span>
            <span className="font-medium">{format(day, "d")}</span>
            {isToday(day) && (
              <span className="absolute -bottom-px left-1/2 h-px w-full -translate-x-1/2 bg-foreground" />
            )}
          </div>
        ))}

        {inventory.map((property) => (
          <PropertyRows
            key={property.propertyId}
            property={property}
            days={days}
            view={view}
            bookingsForUnit={bookingsForUnit}
            unitById={unitById}
            dragSelection={dragSelection}
            draggingBooking={draggingBooking}
            hoveredBookingId={hoveredBookingId}
            onCellPointerDown={handleCellPointerDown}
            onCellPointerEnter={handleCellPointerEnter}
            onStartBookingDrag={startBookingDrag}
            onHoverBooking={setHoveredBookingId}
          />
        ))}
      </div>
    </div>
  );
}

function PropertyRows({
  property,
  days,
  view,
  bookingsForUnit,
  unitById,
  dragSelection,
  draggingBooking,
  hoveredBookingId,
  onCellPointerDown,
  onCellPointerEnter,
  onStartBookingDrag,
  onHoverBooking,
}: {
  property: PropertyInventory;
  days: Date[];
  view: CalendarView;
  bookingsForUnit: (unitId: string) => Booking[];
  unitById: Map<string, Unit>;
  dragSelection: DragSelection | null;
  draggingBooking: DraggingBooking | null;
  hoveredBookingId: string | null;
  onCellPointerDown: (unitId: string, dayIndex: number) => void;
  onCellPointerEnter: (unitId: string, dayIndex: number) => void;
  onStartBookingDrag: (e: React.PointerEvent, booking: Booking) => void;
  onHoverBooking: (id: string | null) => void;
}) {
  return (
    <>
      <div
        className="sticky left-0 z-10 flex items-center border-r border-b bg-background px-2 py-1.5 font-medium text-xs shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]"
        style={{ gridColumn: "1 / span 1" }}
      >
        {property.propertyName}
      </div>
      {days.map((day) => (
        <div
          key={`${property.propertyId}-hdr-${day.toISOString()}`}
          className={cn(
            "border-r border-b bg-background",
            isWeekend(day) && "bg-neutral-50 dark:bg-neutral-900/40",
          )}
        />
      ))}

      {property.roomTypes.map((rt) => (
        <RoomTypeRows
          key={rt.roomType}
          propertyId={property.propertyId}
          roomType={rt.roomType}
          units={rt.units}
          days={days}
          view={view}
          bookingsForUnit={bookingsForUnit}
          unitById={unitById}
          dragSelection={dragSelection}
          draggingBooking={draggingBooking}
          hoveredBookingId={hoveredBookingId}
          onCellPointerDown={onCellPointerDown}
          onCellPointerEnter={onCellPointerEnter}
          onStartBookingDrag={onStartBookingDrag}
          onHoverBooking={onHoverBooking}
        />
      ))}
    </>
  );
}

function RoomTypeRows({
  propertyId,
  roomType,
  units,
  days,
  view,
  bookingsForUnit,
  unitById,
  dragSelection,
  draggingBooking,
  hoveredBookingId,
  onCellPointerDown,
  onCellPointerEnter,
  onStartBookingDrag,
  onHoverBooking,
}: {
  propertyId: string;
  roomType: string;
  units: Unit[];
  days: Date[];
  view: CalendarView;
  bookingsForUnit: (unitId: string) => Booking[];
  unitById: Map<string, Unit>;
  dragSelection: DragSelection | null;
  draggingBooking: DraggingBooking | null;
  hoveredBookingId: string | null;
  onCellPointerDown: (unitId: string, dayIndex: number) => void;
  onCellPointerEnter: (unitId: string, dayIndex: number) => void;
  onStartBookingDrag: (e: React.PointerEvent, booking: Booking) => void;
  onHoverBooking: (id: string | null) => void;
}) {
  const isCondensed = view === "hq";
  // In HQ view, condense all units of a room type onto one occupancy line.
  const rowUnits = isCondensed ? [units[0]] : units;

  return (
    <>
      <div
        className="sticky left-0 z-10 border-r border-b bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]"
        style={{ gridColumn: "1 / span 1" }}
      >
        {roomType}
      </div>
      {days.map((day) => (
        <div
          key={`${propertyId}-${roomType}-hdr-${day.toISOString()}`}
          className={cn(
            "border-r border-b bg-muted/30",
            isWeekend(day) && "bg-neutral-100 dark:bg-neutral-800/40",
          )}
        />
      ))}

      {rowUnits.map((unit) => (
        <UnitRow
          key={unit.id}
          unit={unit}
          days={days}
          isCondensed={isCondensed}
          bookings={bookingsForUnit(unit.id)}
          unitById={unitById}
          dragSelection={dragSelection}
          draggingBooking={draggingBooking}
          hoveredBookingId={hoveredBookingId}
          onCellPointerDown={onCellPointerDown}
          onCellPointerEnter={onCellPointerEnter}
          onStartBookingDrag={onStartBookingDrag}
          onHoverBooking={onHoverBooking}
        />
      ))}
    </>
  );
}

function UnitRow({
  unit,
  days,
  isCondensed,
  bookings,
  unitById,
  dragSelection,
  draggingBooking,
  hoveredBookingId,
  onCellPointerDown,
  onCellPointerEnter,
  onStartBookingDrag,
  onHoverBooking,
}: {
  unit: Unit;
  days: Date[];
  isCondensed: boolean;
  bookings: Booking[];
  unitById: Map<string, Unit>;
  dragSelection: DragSelection | null;
  draggingBooking: DraggingBooking | null;
  hoveredBookingId: string | null;
  onCellPointerDown: (unitId: string, dayIndex: number) => void;
  onCellPointerEnter: (unitId: string, dayIndex: number) => void;
  onStartBookingDrag: (e: React.PointerEvent, booking: Booking) => void;
  onHoverBooking: (id: string | null) => void;
}) {
  const monthStart = days[0];
  const monthEndExclusive = addDays(days[days.length - 1], 1);

  const isDropTarget =
    draggingBooking !== null && draggingBooking.currentUnitId === unit.id;

  return (
    <>
      <div
        className={cn(
          "sticky left-0 z-10 flex items-center border-r border-b bg-background px-2 py-1 text-[11px]",
          isCondensed ? "text-foreground" : "text-muted-foreground",
        )}
        style={{ gridColumn: "1 / span 1", height: ROW_HEIGHT }}
      >
        {isCondensed ? "All units" : `• ${unit.label}`}
      </div>

      <div
        className="relative border-b"
        style={{
          gridColumn: `2 / span ${days.length}`,
          height: ROW_HEIGHT,
          display: "grid",
          gridTemplateColumns: `repeat(${days.length}, ${CELL_WIDTH}px)`,
        }}
        onPointerEnter={() => {
          if (draggingBooking) {
            onCellPointerEnter(unit.id, 0);
          }
        }}
      >
        {days.map((day, dayIndex) => {
          const inSelection =
            dragSelection &&
            dragSelection.unitId === unit.id &&
            dayIndex >=
              Math.min(
                dragSelection.startDayIndex,
                dragSelection.endDayIndex,
              ) &&
            dayIndex <=
              Math.max(dragSelection.startDayIndex, dragSelection.endDayIndex);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r",
                isWeekend(day) && "bg-neutral-50 dark:bg-neutral-900/40",
                inSelection &&
                  "bg-sky-100 outline outline-sky-400 dark:bg-sky-500/20",
                isDropTarget && "bg-sky-50 dark:bg-sky-500/10",
              )}
              onPointerDown={() => onCellPointerDown(unit.id, dayIndex)}
              onPointerEnter={() => onCellPointerEnter(unit.id, dayIndex)}
            />
          );
        })}

        {!isCondensed &&
          bookings.map((booking) => {
            const clampedStart =
              booking.checkIn < monthStart ? monthStart : booking.checkIn;
            const clampedEnd =
              booking.checkOut > monthEndExclusive
                ? monthEndExclusive
                : booking.checkOut;
            if (clampedEnd <= monthStart || clampedStart >= monthEndExclusive) {
              return null;
            }
            const startOffset = differenceInCalendarDays(
              clampedStart,
              monthStart,
            );
            const spanDays = Math.max(
              1,
              differenceInCalendarDays(clampedEnd, clampedStart),
            );
            const isDraggingThis = draggingBooking?.booking.id === booking.id;

            return (
              <Popover
                key={booking.id}
                open={hoveredBookingId === booking.id}
                onOpenChange={(open) =>
                  onHoverBooking(open ? booking.id : null)
                }
              >
                <PopoverTrigger
                  render={
                    <div
                      style={{
                        gridColumn: `${startOffset + 1} / span ${spanDays}`,
                        opacity: isDraggingThis ? 0.4 : 1,
                      }}
                      className="relative z-10 px-px py-0.5"
                    />
                  }
                >
                  <BookingBlock
                    booking={booking}
                    onPointerDownDrag={
                      booking.kind === "reservation"
                        ? (e) => onStartBookingDrag(e, booking)
                        : undefined
                    }
                  />
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                  <BookingQuickView
                    booking={booking}
                    unitLabel={unitById.get(booking.unitId)?.label ?? ""}
                  />
                </PopoverContent>
              </Popover>
            );
          })}
      </div>
    </>
  );
}
