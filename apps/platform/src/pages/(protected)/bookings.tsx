import { Button } from "@propertyos/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { AuditDrawer } from "@/features/bookings/components/audit-drawer";
import { BookingsTable } from "@/features/bookings/components/bookings-table";
import { BulkActionsBar } from "@/features/bookings/components/bulk-actions-bar";
import { CreateBookingBanner } from "@/features/bookings/components/create-booking-banner";
import {
  DEFAULT_FILTERS,
  FilterToolbar,
} from "@/features/bookings/components/filter-toolbar";
import { SettlePaymentSheet } from "@/features/bookings/components/settle-payment-sheet";
import { SummaryBand } from "@/features/bookings/components/summary-band";
import { TablePagination } from "@/features/bookings/components/table-pagination";
import {
  type Booking,
  buildBookings,
  buildBookingsSummary,
  resolveBookingsProperties,
} from "@/features/bookings/lib/mock-data";
import { useProperties } from "@/features/properties/api/use-properties";

export const Route = createFileRoute("/(protected)/bookings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeScopeId } = useActiveHq();
  const { data: propertiesResponse } = useProperties(activeScopeId);

  const properties = useMemo(
    () => resolveBookingsProperties(propertiesResponse?.data),
    [propertiesResponse?.data],
  );

  const [bookings, setBookings] = useState<Booking[]>([]);
  useMemo(() => {
    setBookings(buildBookings(properties));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [auditBooking, setAuditBooking] = useState<Booking | null>(null);
  const [settleBooking, setSettleBooking] = useState<Booking | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredBookings = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (
        filters.propertyId !== "all" &&
        booking.propertyId !== filters.propertyId
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
        !booking.guestName.toLowerCase().includes(search) &&
        !booking.guestPhone.toLowerCase().includes(search) &&
        !booking.ref.toLowerCase().includes(search)
      ) {
        return false;
      }
      return true;
    });
  }, [bookings, filters]);

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
        <Button onClick={() => setCreateOpen((v) => !v)}>
          <PlusIcon />
          Create Booking
        </Button>
      </motion.div>

      <SummaryBand summary={summary} />

      <CreateBookingBanner
        open={createOpen}
        properties={properties}
        onClose={() => setCreateOpen(false)}
        onCreated={() => setCreateOpen(false)}
      />

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

      <AuditDrawer
        booking={auditBooking}
        onOpenChange={(open) => !open && setAuditBooking(null)}
      />

      <SettlePaymentSheet
        booking={settleBooking}
        onOpenChange={(open) => !open && setSettleBooking(null)}
        onSettled={(bookingId, amountPaise) => {
          setBookings((prev) =>
            prev.map((b) =>
              b.id === bookingId
                ? {
                    ...b,
                    paidPaise: Math.min(
                      b.totalPaise,
                      b.paidPaise + amountPaise,
                    ),
                  }
                : b,
            ),
          );
          setSettleBooking(null);
        }}
      />
    </div>
  );
}
