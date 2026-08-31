import { Button } from "@propertyos/ui/components/button";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute } from "@tanstack/react-router";
import { DownloadIcon, PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { TablePagination } from "@/features/bookings/components/table-pagination";
import { invalidateGuest } from "@/features/guests/api/use-guest";
import {
  useAddGuestNote,
  useRemoveGuestNote,
} from "@/features/guests/api/use-guest-notes";
import {
  useAddGuestTag,
  useRemoveGuestTag,
} from "@/features/guests/api/use-guest-tags";
import {
  invalidateGuestTagsInUse,
  useGuestTagsInUse,
} from "@/features/guests/api/use-guest-tags-in-use";
import { invalidateGuests, useGuests } from "@/features/guests/api/use-guests";
import { AddGuestDialog } from "@/features/guests/components/add-guest-dialog";
import { BulkActionsBar } from "@/features/guests/components/bulk-actions-bar";
import { EditGuestDialog } from "@/features/guests/components/edit-guest-dialog";
import {
  DEFAULT_FILTERS,
  FilterToolbar,
} from "@/features/guests/components/filter-toolbar";
import { GuestProfileDrawer } from "@/features/guests/components/guest-profile-drawer";
import { GuestsTable } from "@/features/guests/components/guests-table";
import { OfferLinkDialog } from "@/features/guests/components/offer-link-dialog";
import { SummaryBand } from "@/features/guests/components/summary-band";
import { buildGuestsSummary, type Guest } from "@/features/guests/lib/guest";
import { getApiErrorMessage } from "@/shared/lib/api-error";

export const Route = createFileRoute("/(protected)/guests")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeScopeId } = useActiveHq();
  const feedback = useFeedback();

  const { data: guestsResponse, isLoading } = useGuests(activeScopeId);
  const guests = useMemo(
    () => (guestsResponse?.data ?? []) as Guest[],
    [guestsResponse?.data],
  );

  const { data: tagsResponse } = useGuestTagsInUse(activeScopeId);
  const tagsInUse = useMemo(
    () => (tagsResponse?.data ?? []).map((row) => row.tag),
    [tagsResponse?.data],
  );

  const addTag = useAddGuestTag();
  const removeTag = useRemoveGuestTag();
  const addNote = useAddGuestNote();
  const removeNote = useRemoveGuestNote();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [profileGuest, setProfileGuest] = useState<Guest | null>(null);
  const [offerGuest, setOfferGuest] = useState<Guest | null>(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isSaving =
    addTag.isPending ||
    removeTag.isPending ||
    addNote.isPending ||
    removeNote.isPending;

  /**
   * Refetches the directory and the open profile.
   *
   * Both are invalidated because a tag or note changes the row in the table
   * and the drawer above it -- refreshing one would leave the other stale.
   */
  function refresh(guestId?: string) {
    invalidateGuests(activeScopeId);
    invalidateGuest(guestId);
    // A new or removed tag changes the vocabulary the filter offers.
    invalidateGuestTagsInUse(activeScopeId);
  }

  const filteredGuests = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return guests.filter((guest) => {
      if (filters.tag !== "all" && !guest.tags.includes(filters.tag)) {
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
        !(guest.email?.toLowerCase().includes(search) ?? false) &&
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

  function tagError(error: unknown) {
    feedback.error(
      "Couldn't update tags",
      getApiErrorMessage(error, "Something went wrong. Try again."),
    );
  }

  function handleAddTag(guestId: string, tag: string) {
    addTag.mutate(
      { param: { id: guestId }, json: { tag } },
      { onSuccess: () => refresh(guestId), onError: tagError },
    );
  }

  function handleRemoveTag(guestId: string, tag: string) {
    removeTag.mutate(
      { param: { id: guestId, tag } },
      { onSuccess: () => refresh(guestId), onError: tagError },
    );
  }

  function handleAddNote(guestId: string, text: string) {
    addNote.mutate(
      { param: { id: guestId }, json: { text } },
      {
        onSuccess: () => refresh(guestId),
        onError: (error) => {
          feedback.error(
            "Couldn't add note",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          );
        },
      },
    );
  }

  function handleRemoveNote(noteId: string) {
    removeNote.mutate(
      { param: { noteId } },
      {
        onSuccess: () => refresh(profileGuest?.id),
        onError: (error) => {
          feedback.error(
            "Couldn't remove note",
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
          <h1 className="text-display-md">Guest CRM Directory</h1>
          <p className="text-muted-foreground text-sm">
            Track guest lifetime value and run targeted marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <DownloadIcon />
            Export CSV
          </Button>
          <Button onClick={() => setAddGuestOpen(true)}>
            <PlusIcon />
            Add Guest
          </Button>
        </div>
      </motion.div>

      <SummaryBand summary={summary} />

      <div className="flex flex-col gap-3">
        <FilterToolbar
          filters={filters}
          tagsInUse={tagsInUse}
          onChange={handleFiltersChange}
        />
        <GuestsTable
          guests={pagedGuests}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onOpenProfile={setProfileGuest}
          onGenerateOffer={setOfferGuest}
          onEdit={setEditingGuest}
          isLoading={isLoading}
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
        onRemoveNote={handleRemoveNote}
        onGenerateOffer={(guest) => setOfferGuest(guest)}
        isSaving={isSaving}
      />

      <EditGuestDialog
        guest={editingGuest}
        tagsInUse={tagsInUse}
        onOpenChange={(open) => !open && setEditingGuest(null)}
        onSaved={(guestId) => refresh(guestId)}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        isTagSaving={addTag.isPending || removeTag.isPending}
      />

      <AddGuestDialog
        open={addGuestOpen}
        onOpenChange={setAddGuestOpen}
        onCreated={() => refresh()}
      />

      <OfferLinkDialog
        guest={offerGuest}
        onOpenChange={(open) => !open && setOfferGuest(null)}
      />
    </div>
  );
}
