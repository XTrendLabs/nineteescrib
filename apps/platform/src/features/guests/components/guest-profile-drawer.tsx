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
import { format } from "date-fns";
import { LinkIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { formatStayRange } from "../../bookings/lib/format";
import { formatInr, initials } from "../lib/format";
import type { Guest } from "../lib/mock-data";
import { TagPill } from "./tag-pill";

export function GuestProfileDrawer({
  guest,
  onOpenChange,
  onAddNote,
  onGenerateOffer,
}: {
  guest: Guest | null;
  onOpenChange: (open: boolean) => void;
  onAddNote: (guestId: string, text: string) => void;
  onGenerateOffer: (guest: Guest) => void;
}) {
  const [noteText, setNoteText] = useState("");

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
                {guest?.email} · {guest?.phone}
              </SheetDescription>
            </div>
          </div>
          {guest && guest.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {guest.tags.map((tag) => (
                <TagPill key={tag} tag={tag} />
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
                  {formatInr(guest.totalSpentPaise)}
                </span>
              </span>
              <span>
                Stays:{" "}
                <span className="font-medium tabular-nums">
                  {guest.totalStays}
                </span>
              </span>
            </div>

            <div>
              <p className="mb-2 font-medium text-sm">Operational Notes</p>
              <div className="flex flex-col gap-2">
                {guest.notes.length === 0 && (
                  <p className="text-muted-foreground text-xs">No notes yet.</p>
                )}
                {guest.notes.map((note) => (
                  <div
                    key={note.id}
                    className="border bg-muted/20 px-2.5 py-2 text-xs"
                  >
                    <p>{note.text}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {format(note.createdAt, "MMM d, yyyy")}
                    </p>
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
                    disabled={!noteText.trim()}
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
                {guest.stays.map((stay) => (
                  <div key={stay.ref} className="border px-2.5 py-2 text-xs">
                    <p className="font-medium">
                      {stay.ref} · {stay.propertyName}
                    </p>
                    <p className="text-muted-foreground">
                      {formatStayRange(stay.checkIn, stay.checkOut)}
                    </p>
                    <p className="mt-0.5">
                      {stay.roomType} · Paid: {formatInr(stay.paidPaise)}
                    </p>
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
