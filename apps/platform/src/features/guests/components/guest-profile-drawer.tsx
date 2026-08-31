import { Avatar, AvatarFallback } from "@propertyos/ui/components/avatar";
import { Button } from "@propertyos/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@propertyos/ui/components/sheet";
import { LinkIcon, PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { useGuest } from "../api/use-guest";
import {
  formatInr,
  formatNoteDate,
  formatStayRange,
  initials,
} from "../lib/format";
import type { Guest, GuestTag, StayRecord } from "../lib/guest";
import { TagPill } from "./tag-pill";

/** What a stay was worth, and whether it still counts. */
function stayLine(stay: StayRecord) {
  const amount = formatInr(stay.totalAmountPaise);
  return stay.status === "cancelled" ? `${amount} · cancelled` : amount;
}

export function GuestProfileDrawer({
  guest,
  onOpenChange,
  onAddNote,
  onRemoveNote,
  onGenerateOffer,
  isSaving,
}: {
  guest: Guest | null;
  onOpenChange: (open: boolean) => void;
  onAddNote: (guestId: string, text: string) => void;
  onRemoveNote: (noteId: string) => void;
  onGenerateOffer: (guest: Guest) => void;
  isSaving?: boolean;
}) {
  const [noteText, setNoteText] = useState("");

  // The drawer loads its own detail -- stays and notes are only ever read for
  // the guest whose profile is open.
  const { data, isLoading } = useGuest(guest?.id);
  const profile = data?.data;

  const tags = profile?.tags ?? guest?.tags ?? [];
  const stays = profile?.stays ?? [];
  const notes = profile?.notes ?? [];

  return (
    <Sheet
      open={guest !== null}
      onOpenChange={(open) => {
        if (!open) setNoteText("");
        onOpenChange(open);
      }}
    >
      <SheetContent className="data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {guest ? initials(guest.name) : ""}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="font-display text-lg">
                {guest?.name}
              </SheetTitle>
              <SheetDescription>
                {guest?.email ? `${guest.email} · ` : ""}
                {guest?.phone}
              </SheetDescription>
            </div>
          </div>

          {/* Read-only here; tags are edited in the Edit Guest dialog. */}
          {guest && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <TagPill key={tag} tag={tag as GuestTag} />
              ))}
            </div>
          )}
        </SheetHeader>

        {guest && (
          <div className="flex flex-col gap-5 px-4">
            <div className="flex items-center justify-between border bg-muted/30 p-3 text-xs">
              <span>
                Total Spent:{" "}
                <span className="font-medium tabular-nums">
                  {formatInr(profile?.totalSpentPaise ?? guest.totalSpentPaise)}
                </span>
              </span>
              <span>
                Stays:{" "}
                <span className="font-medium tabular-nums">
                  {profile?.totalStays ?? guest.totalStays}
                </span>
              </span>
            </div>

            <div>
              <p className="mb-2 font-medium text-sm">Operational Notes</p>
              <div className="flex flex-col gap-2">
                {!isLoading && notes.length === 0 && (
                  <p className="text-muted-foreground text-xs">No notes yet.</p>
                )}
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="group flex items-start justify-between gap-2 border bg-muted/20 px-2.5 py-2 text-xs"
                  >
                    <div>
                      <p>{note.text}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatNoteDate(note.createdAt)}
                        {note.authorName ? ` · ${note.authorName}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isSaving}
                      onClick={() => onRemoveNote(note.id)}
                    >
                      <XIcon />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add new note..."
                    rows={1}
                    className="h-8 w-full min-w-0 resize-none rounded-none border border-input bg-transparent px-2.5 py-1 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                  />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={!noteText.trim() || isSaving}
                    onClick={() => {
                      if (!noteText.trim()) return;
                      onAddNote(guest.id, noteText.trim());
                      setNoteText("");
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium text-sm">Reservation History</p>
              <div className="flex flex-col gap-2">
                {isLoading && (
                  <p className="text-muted-foreground text-xs">
                    Loading stays...
                  </p>
                )}
                {!isLoading && stays.length === 0 && (
                  <p className="text-muted-foreground text-xs">
                    No stays recorded yet.
                  </p>
                )}
                {stays.map((stay) => (
                  <div key={stay.id} className="border px-2.5 py-2 text-xs">
                    <p className="font-medium">
                      {stay.ref} · {stay.propertyName}
                    </p>
                    <p className="text-muted-foreground">
                      {formatStayRange(stay.checkIn, stay.checkOut)}
                    </p>
                    <p className="mt-0.5">{stayLine(stay)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <SheetFooter>
          <Button
            disabled={!guest}
            onClick={() => guest && onGenerateOffer(guest)}
          >
            <LinkIcon />
            Generate Private Custom Offer Link
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
