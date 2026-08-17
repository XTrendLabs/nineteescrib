import { Button } from "@propertyos/ui/components/button";
import { Input } from "@propertyos/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@propertyos/ui/components/sheet";
import { CopyIcon } from "lucide-react";
import { useState } from "react";
import type { Guest } from "../lib/mock-data";
import { buildOfferLink } from "../lib/mock-data";

export function OfferLinkDialog({
  guest,
  onOpenChange,
}: {
  guest: Guest | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [dates, setDates] = useState("");
  const [price, setPrice] = useState("");

  const link = guest ? buildOfferLink(guest, price, dates) : "";

  return (
    <Sheet
      open={guest !== null}
      onOpenChange={(open) => {
        if (!open) {
          setDates("");
          setPrice("");
        }
        onOpenChange(open);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Generate Custom Offer Link</SheetTitle>
          <SheetDescription>
            {guest && `${guest.name} · ${guest.email}`}
          </SheetDescription>
        </SheetHeader>

        {guest && (
          <div className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Stay dates</span>
              <Input
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                placeholder="e.g. Dec 20 - 23"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Custom price (₹)
              </span>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                WhatsApp link
              </span>
              <div className="break-all border bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
                {link}
              </div>
            </div>
          </div>
        )}

        <SheetFooter>
          <Button
            disabled={!guest}
            onClick={() => {
              if (link) navigator.clipboard.writeText(link);
            }}
          >
            <CopyIcon />
            Copy Link
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
