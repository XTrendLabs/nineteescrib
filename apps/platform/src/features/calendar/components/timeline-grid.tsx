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

import type {
  CalendarBooking as Booking,
  PropertyInventory,
  Unit,
} from "../lib/calendar";
import { hasConflict, roomTypeLabel } from "../lib/calendar";
import { BookingBlock } from "./booking-block";
import { BookingQuickView } from "./booking-popover";
import type { QuickCreateSelection } from "./quick-create-dialog";
import type { CalendarView } from "./view-toggle";

const CELL_WIDTH = 88;
const ROW_HEIGHT = 36;
const LABEL_WIDTH = 208;
/** Height of one stacked booking bar inside a room's row. */
const LANE_HEIGHT = 22;

/**
 * Packs bookings into horizontal lanes so overlapping stays stack.
 *
 * A room legitimately holds several bookings over a month, and a cancelled or
 * checked-out one can sit on the same nights as a live booking. Each is given
 * the first lane where it does not collide, so a room's row is exactly as tall
 * as its busiest overlap rather than a fixed height the blocks spill out of.
 */
function assignLanes<T extends { checkIn: Date; checkOut: Date }>(
  bookings: T[],
): { booking: T; lane: number }[] {
  const laneEnds: number[] = [];

  return [...bookings]
    .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
    .map((booking) => {
      const start = booking.checkIn.getTime();
      let lane = laneEnds.findIndex((end) => end <= start);
      if (lane === -1) {
        lane = laneEnds.length;
      }
      laneEnds[lane] = booking.checkOut.getTime();
      return { booking, lane };
    });
}

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
  onRequestCreate: (selection: QuickCreateSelection) => void;
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
            unitId: unit.id,
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
      /**
       * Fills whatever height the page leaves it, rather than a fixed slice of
       * the viewport: 70vh left dead space on a tall screen and still clipped
       * on a short one. The grid scrolls inside itself once the rooms outgrow
       * the space, so the page around it never scrolls away from the header.
       */
      className="min-h-0 flex-1 overflow-auto border"
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
        <div className="sticky top-0 left-0 z-30 border-r border-b bg-muted/50 bg-white opacity-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)] dark:bg-black" />
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
        className="sticky left-0 z-10 flex items-center border-r border-b bg-white px-2 py-1.5 font-medium text-xs opacity-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)] dark:bg-black"
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

      {/* A property with nothing published would otherwise render a heading
          with a void beneath it, which reads as a loading failure. */}
      {property.roomTypes.length === 0 && (
        <>
          <div
            className="sticky left-0 z-10 flex items-center border-r border-b bg-white px-2 py-1 text-[11px] text-muted-foreground opacity-100 backdrop-blur-3xl dark:bg-black"
            style={{ gridColumn: "1 / span 1", height: ROW_HEIGHT }}
          >
            No published rooms
          </div>
          <div
            className="border-b"
            style={{
              gridColumn: `2 / span ${days.length}`,
              height: ROW_HEIGHT,
            }}
          />
        </>
      )}

      {property.roomTypes.map((rt) => (
        <RoomTypeRows
          key={rt.roomType}
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

  // HQ view answers "how full is this room type", so it draws one occupancy
  // line per type rather than a row per room. The detailed view keeps a row
  // for every room.
  if (isCondensed) {
    return (
      <OccupancyRow
        units={units}
        days={days}
        bookingsForUnit={bookingsForUnit}
      />
    );
  }

  return (
    <>
      {units.map((unit) => (
        <UnitRow
          key={unit.id}
          unit={unit}
          days={days}
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

/**
 * One line per room type showing how full it is each night.
 *
 * The HQ view is asking a different question from the detailed grid: not
 * "where is this guest" but "how much of this type is left". Drawing every
 * room's bookings on one line would just overlap them illegibly, so each night
 * is summarised as taken-of-total instead.
 */
function OccupancyRow({
  units,
  days,
  bookingsForUnit,
}: {
  units: Unit[];
  days: Date[];
  bookingsForUnit: (unitId: string) => Booking[];
}) {
  const total = units.length;

  // A room is taken on a night when a booking covers it. Cancelled and
  // checked-out stays never reach the calendar, so anything here occupies.
  const takenPerDay = days.map((day) => {
    const next = addDays(day, 1);
    return units.filter((unit) =>
      bookingsForUnit(unit.id).some(
        (b) => b.checkIn < next && b.checkOut > day,
      ),
    ).length;
  });

  return (
    <>
      <div
        className="sticky left-0 z-10 flex items-center border-r border-b bg-white px-2 py-1 text-[11px] opacity-100 backdrop-blur-3xl dark:bg-black"
        style={{ gridColumn: "1 / span 1", height: ROW_HEIGHT }}
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="truncate text-foreground">
            {roomTypeLabel(units[0]?.roomType ?? "other")}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {total} {total === 1 ? "room" : "rooms"}
          </span>
        </span>
      </div>

      {days.map((day, i) => {
        const taken = takenPerDay[i] ?? 0;
        const free = total - taken;
        const full = total > 0 && free === 0;

        return (
          <div
            key={`occ-${day.toISOString()}`}
            className={cn(
              "flex items-center justify-center border-r border-b text-[11px] tabular-nums",
              isWeekend(day) && "bg-neutral-50 dark:bg-neutral-900/40",
              full
                ? "bg-destructive/70 font-medium text-white"
                : taken > 0
                  ? "bg-warning/40 text-foreground"
                  : "text-muted-foreground",
            )}
            style={{ height: ROW_HEIGHT }}
          >
            {total === 0 ? "—" : `${taken}/${total}`}
          </div>
        );
      })}
    </>
  );
}

function UnitRow({
  unit,
  days,
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

  // Only the bookings actually visible decide the height -- a stay outside the
  // window would otherwise pad the row for nothing.
  const visible = bookings.filter(
    (b) => b.checkOut > monthStart && b.checkIn < monthEndExclusive,
  );
  const laned = assignLanes(visible);
  const laneCount = laned.reduce((max, l) => Math.max(max, l.lane + 1), 0);
  const rowHeight = Math.max(ROW_HEIGHT, laneCount * LANE_HEIGHT + 8);

  return (
    <>
      <div
        className="sticky left-0 z-10 flex items-center border-r border-b bg-white px-2 py-1 text-[11px] text-muted-foreground opacity-100 backdrop-blur-3xl dark:bg-black"
        style={{ gridColumn: "1 / span 1", height: rowHeight }}
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="truncate text-foreground">{unit.label}</span>
          {/* The type earns its place next to the room rather than as a banner
              row: it is an attribute of the room, and a separate heading row
              cost vertical space on every group. */}
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {roomTypeLabel(unit.roomType)}
          </span>
        </span>
      </div>

      <div
        className="relative border-b"
        style={{
          gridColumn: `2 / span ${days.length}`,
          height: rowHeight,
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
              style={{ gridRow: 1 }}
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

        {laned.map(({ booking, lane }) => {
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
              onOpenChange={(open) => onHoverBooking(open ? booking.id : null)}
            >
              <PopoverTrigger
                render={
                  <div
                    style={{
                      // Placed in the single explicit row and offset by lane,
                      // so a stack of bookings never spawns implicit rows the
                      // row's own height cannot account for.
                      gridRow: 1,
                      gridColumn: `${startOffset + 1} / span ${spanDays}`,
                      top: lane * LANE_HEIGHT + 4,
                      height: LANE_HEIGHT - 2,
                      opacity: isDraggingThis ? 0.4 : 1,
                    }}
                    className="relative z-10 self-start px-px"
                  />
                }
              >
                <BookingBlock
                  booking={booking}
                  onPointerDownDrag={
                    booking.kind === "reservation" && !booking.checkedOut
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
