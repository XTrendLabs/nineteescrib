import { Button } from "@propertyos/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { DownloadIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { TablePagination } from "@/features/bookings/components/table-pagination";
import { BulkActionsBar } from "@/features/guests/components/bulk-actions-bar";
import {
  DEFAULT_FILTERS,
  FilterToolbar,
} from "@/features/guests/components/filter-toolbar";
import { GuestProfileDrawer } from "@/features/guests/components/guest-profile-drawer";
import { GuestsTable } from "@/features/guests/components/guests-table";
import { OfferLinkDialog } from "@/features/guests/components/offer-link-dialog";
import { SummaryBand } from "@/features/guests/components/summary-band";
import {
  buildGuests,
  buildGuestsSummary,
  type Guest,
} from "@/features/guests/lib/mock-data";

export const Route = createFileRoute("/(protected)/guests")({
  component: RouteComponent,
});

function RouteComponent() {
  const [guests, setGuests] = useState<Guest[]>(() => buildGuests());
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [profileGuest, setProfileGuest] = useState<Guest | null>(null);
  const [offerGuest, setOfferGuest] = useState<Guest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredGuests = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return guests.filter((guest) => {
      if (filters.tag !== "all" && !guest.tags.includes(filters.tag as never)) {
        return false;
      }
      if (filters.spend === "over_50k" && guest.totalSpentPaise <= 5_000_000) {
        return false;
      }
      if (
        filters.spend === "10k_50k" &&
        (guest.totalSpentPaise < 1_000_000 || guest.totalSpentPaise > 5_000_000)
      ) {
        return false;
      }
      if (filters.spend === "under_10k" && guest.totalSpentPaise >= 1_000_000) {
        return false;
      }
      if (
        search &&
        !guest.name.toLowerCase().includes(search) &&
        !guest.email.toLowerCase().includes(search) &&
        !guest.phone.toLowerCase().includes(search)
      ) {
        return false;
      }
      return true;
    });
  }, [guests, filters]);

  const summary = useMemo(() => buildGuestsSummary(guests), [guests]);

  const pageCount = Math.max(1, Math.ceil(filteredGuests.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedGuests = useMemo(
    () =>
      filteredGuests.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      ),
    [filteredGuests, currentPage, pageSize],
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
      prev.size === pagedGuests.length
        ? new Set()
        : new Set(pagedGuests.map((g) => g.id)),
    );
  }

  function handleAddNote(guestId: string, text: string) {
    const note = {
      id: `note-${guestId}-${Date.now()}`,
      text,
      createdAt: new Date(),
    };
    setGuests((prev) =>
      prev.map((g) =>
        g.id === guestId ? { ...g, notes: [note, ...g.notes] } : g,
      ),
    );
    setProfileGuest((prev) =>
      prev && prev.id === guestId
        ? { ...prev, notes: [note, ...prev.notes] }
        : prev,
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
          <h1 className="text-display-md">Guest CRM Directory</h1>
          <p className="text-muted-foreground text-sm">
            Track guest lifetime value and run targeted marketing campaigns
          </p>
        </div>
        <Button variant="outline">
          <DownloadIcon />
          Export CSV
        </Button>
      </motion.div>

      <SummaryBand summary={summary} />

      <div className="flex flex-col gap-3">
        <FilterToolbar filters={filters} onChange={handleFiltersChange} />
        <GuestsTable
          guests={pagedGuests}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onOpenProfile={setProfileGuest}
          onGenerateOffer={setOfferGuest}
        />
        <TablePagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredGuests.length}
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

      <GuestProfileDrawer
        guest={profileGuest}
        onOpenChange={(open) => !open && setProfileGuest(null)}
        onAddNote={handleAddNote}
        onGenerateOffer={(guest) => setOfferGuest(guest)}
      />

      <OfferLinkDialog
        guest={offerGuest}
        onOpenChange={(open) => !open && setOfferGuest(null)}
      />
    </div>
  );
}
