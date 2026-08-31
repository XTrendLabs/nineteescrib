import { Button } from "@propertyos/ui/components/button";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import {
  invalidateBookings,
  useBookings,
} from "@/features/bookings/api/use-bookings";
import { useCancelBooking } from "@/features/bookings/api/use-cancel-booking";
import { useChangeBookingStatus } from "@/features/bookings/api/use-change-booking-status";
import { useCreateBooking } from "@/features/bookings/api/use-create-booking";
import { useRecordBookingPayment } from "@/features/bookings/api/use-record-booking-payment";
import { AuditDrawer } from "@/features/bookings/components/audit-drawer";
import {
  type BookingAction,
  BookingsTable,
} from "@/features/bookings/components/bookings-table";
import { BulkActionsBar } from "@/features/bookings/components/bulk-actions-bar";
import {
  CreateBookingDialog,
  type NewBookingInput,
} from "@/features/bookings/components/create-booking-dialog";
import { ExtendStayDialog } from "@/features/bookings/components/extend-stay-dialog";
import {
  DEFAULT_FILTERS,
  FilterToolbar,
} from "@/features/bookings/components/filter-toolbar";
import { SettlePaymentSheet } from "@/features/bookings/components/settle-payment-sheet";
import { SummaryBand } from "@/features/bookings/components/summary-band";
import { TablePagination } from "@/features/bookings/components/table-pagination";
import {
  type Booking,
  type BookingPaymentMethod,
  buildBookingsSummary,
} from "@/features/bookings/lib/booking";
import { resolveBookingProperties } from "@/features/bookings/lib/property";
import { useProperties } from "@/features/properties/api/use-properties";
import { getApiErrorMessage } from "@/shared/lib/api-error";

export const Route = createFileRoute("/(protected)/bookings")({
  component: RouteComponent,
});

/** The status each menu action asks the server for. */
type BookingTransition = "confirmed" | "checked_in" | "checked_out";

const STATUS_BY_ACTION: Partial<Record<BookingAction, BookingTransition>> = {
  confirm: "confirmed",
  check_in: "checked_in",
  check_out: "checked_out",
};

const ACTION_PAST_TENSE: Record<BookingTransition, string> = {
  confirmed: "confirmed",
  checked_in: "checked in",
  checked_out: "checked out",
};

function RouteComponent() {
  const { activeScopeId } = useActiveHq();
  const feedback = useFeedback();

  const { data: propertiesResponse } = useProperties(activeScopeId);
  const { data: bookingsResponse, isLoading } = useBookings(activeScopeId);

  const properties = useMemo(
    () => resolveBookingProperties(propertiesResponse?.data),
    [propertiesResponse?.data],
  );

  const bookings = useMemo(
    () => (bookingsResponse?.data ?? []) as Booking[],
    [bookingsResponse?.data],
  );

  const createBooking = useCreateBooking();
  const changeStatus = useChangeBookingStatus();
  const cancelBooking = useCancelBooking();
  const recordPayment = useRecordBookingPayment();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [auditBooking, setAuditBooking] = useState<Booking | null>(null);
  const [settleBooking, setSettleBooking] = useState<Booking | null>(null);
  const [extendBooking, setExtendBooking] = useState<Booking | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /** Refetches the list every mutation invalidates. */
  function refresh() {
    invalidateBookings(activeScopeId);
  }

  const filteredBookings = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (
        filters.propertyId !== "all" &&
        booking.organizationId !== filters.propertyId
      ) {
        return false;
      }
      if (filters.status !== "all" && booking.status !== filters.status) {
        return false;
      }
      if (filters.source !== "all" && booking.source !== filters.source) {
        return false;
      }
      if (
        search &&
        !(booking.guestName?.toLowerCase().includes(search) ?? false) &&
        !(booking.guestPhone?.toLowerCase().includes(search) ?? false) &&
        !booking.ref.toLowerCase().includes(search)
      ) {
        return false;
      }
      return true;
    });
  }, [bookings, filters]);

  // Computed over every booking rather than the filtered page: the band
  // reports the state of the business, not of the current view.
  const summary = useMemo(() => buildBookingsSummary(bookings), [bookings]);

  const pageCount = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedBookings = useMemo(
    () =>
      filteredBookings.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      ),
    [filteredBookings, currentPage, pageSize],
  );

  function handleFiltersChange(next: typeof filters) {
    setFilters(next);
    setPage(1);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === pagedBookings.length
        ? new Set()
        : new Set(pagedBookings.map((b) => b.id)),
    );
  }

  function handleCreate(input: NewBookingInput) {
    createBooking.mutate(
      { json: input },
      {
        onSuccess: () => {
          refresh();
          setCreateOpen(false);
          feedback.success(
            "Booking created",
            `${input.guest.name} has been booked in.`,
          );
        },
        onError: (error) => {
          feedback.error(
            "Couldn't create booking",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          );
        },
      },
    );
  }

  /**
   * Invoicing is not built yet: there is no invoice table and nothing links a
   * booking to one, so every booking is on the "generate" path. Says so
   * plainly rather than opening a form that cannot save anything.
   */
  function handleInvoice(booking: Booking) {
    feedback.success(
      "Invoicing is coming soon",
      `${booking.ref} can't be invoiced yet — this feature is still being built.`,
    );
  }

  function handleAction(action: BookingAction, booking: Booking) {
    if (action === "invoice") {
      handleInvoice(booking);
      return;
    }

    if (action === "extend") {
      setExtendBooking(booking);
      return;
    }

    if (action === "cancel") {
      cancelBooking.mutate(
        { param: { id: booking.id }, json: {} },
        {
          onSuccess: () => {
            refresh();
            feedback.success(
              "Booking cancelled",
              `${booking.ref} is cancelled.`,
            );
          },
          onError: (error) => {
            feedback.error(
              "Couldn't cancel booking",
              getApiErrorMessage(error, "Something went wrong. Try again."),
            );
          },
        },
      );
      return;
    }

    const status = STATUS_BY_ACTION[action];
    if (!status) return;

    changeStatus.mutate(
      { param: { id: booking.id }, json: { status } },
      {
        onSuccess: () => {
          refresh();
          feedback.success(
            "Booking updated",
            `${booking.ref} is now ${ACTION_PAST_TENSE[status] ?? status}.`,
          );
        },
        onError: (error) => {
          feedback.error(
            "Couldn't update booking",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          );
        },
      },
    );
  }

  function handleSettle(input: {
    bookingId: string;
    amountPaise: number;
    method: BookingPaymentMethod;
    paidAt: string;
  }) {
    recordPayment.mutate(
      {
        param: { id: input.bookingId },
        json: {
          amountPaise: input.amountPaise,
          method: input.method,
          paidAt: input.paidAt,
        },
      },
      {
        onSuccess: () => {
          refresh();
          setSettleBooking(null);
          feedback.success("Payment recorded", "The ledger has been updated.");
        },
        onError: (error) => {
          feedback.error(
            "Couldn't record payment",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          );
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-display-md">Bookings Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Manage stays, payments, and reservations across your portfolio
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Create Booking
        </Button>
      </motion.div>

      <SummaryBand summary={summary} />

      <div className="flex flex-col gap-3">
        <FilterToolbar
          properties={properties}
          filters={filters}
          onChange={handleFiltersChange}
        />
        <BookingsTable
          bookings={pagedBookings}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onOpenAudit={setAuditBooking}
          onOpenSettle={setSettleBooking}
          onAction={handleAction}
          onInvoice={handleInvoice}
          isLoading={isLoading}
        />
        <TablePagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredBookings.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      <BulkActionsBar
        count={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
      />

      <CreateBookingDialog
        open={createOpen}
        properties={properties}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
        isSaving={createBooking.isPending}
      />

      <AuditDrawer
        booking={auditBooking}
        onOpenChange={(open) => !open && setAuditBooking(null)}
      />

      <ExtendStayDialog
        booking={extendBooking}
        onOpenChange={(open) => !open && setExtendBooking(null)}
        onExtended={refresh}
      />

      <SettlePaymentSheet
        booking={settleBooking}
        onOpenChange={(open) => !open && setSettleBooking(null)}
        onSettled={handleSettle}
        isSaving={recordPayment.isPending}
      />
    </div>
  );
}
