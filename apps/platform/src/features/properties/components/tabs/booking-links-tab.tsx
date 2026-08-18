import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import { CopyIcon, ExternalLinkIcon, LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { BookingLinkConfig, PropertyDetail } from "../../lib/mock-data";

function PrivateLinkDialog({
  property,
  open,
  onOpenChange,
}: {
  property: PropertyDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [dates, setDates] = useState("");
  const [price, setPrice] = useState("");

  const generatedLink = `https://book.propertyos.in/${property.slug}?deal=${encodeURIComponent(
    `${dates || "flexible"}-${price || "std"}`,
  )}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setDates("");
          setPrice("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Private Deal Link</DialogTitle>
          <DialogDescription>
            One-time pre-filled booking link with custom pricing.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-4">
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
              Generated link
            </span>
            <div className="break-all border bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
              {generatedLink}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(generatedLink);
              toast.success("Link copied to clipboard");
            }}
          >
            <CopyIcon />
            Copy Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BookingLinksTab({ property }: { property: PropertyDetail }) {
  const [bookingLink, setBookingLink] = useState<BookingLinkConfig>(
    property.bookingLink,
  );
  const [welcomeText, setWelcomeText] = useState(bookingLink.welcomeText);
  const [privateLinkOpen, setPrivateLinkOpen] = useState(false);

  const publicUrl = `https://book.propertyos.in/${bookingLink.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">Public Booking Page</p>
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <p className="break-all text-xs">🌐 {publicUrl}</p>
            <div className="flex items-center gap-2">
              <Badge variant={bookingLink.isLive ? "success" : "muted"}>
                {bookingLink.isLive ? "● Live" : "Inactive"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  toast.success("Link copied to clipboard");
                }}
              >
                <CopyIcon />
                Copy
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLinkIcon />
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">Brand Customization</p>
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="flex items-center gap-3">
              <span className="w-32 text-muted-foreground text-xs">Logo</span>
              <Button variant="outline" size="sm">
                Upload
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-32 text-muted-foreground text-xs">
                Accent Color
              </span>
              <input
                type="color"
                value={bookingLink.accentColor}
                onChange={(e) =>
                  setBookingLink((prev) => ({
                    ...prev,
                    accentColor: e.target.value,
                  }))
                }
                className="h-8 w-16 cursor-pointer border border-input"
              />
              <span className="text-xs">{bookingLink.accentColor}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Welcome Text
              </span>
              <textarea
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                rows={2}
                className="w-full min-w-0 resize-none rounded-none border border-input bg-transparent px-2.5 py-1.5 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-32 text-muted-foreground text-xs">
                Terms & Conds
              </span>
              <Button variant="outline" size="sm">
                Edit Link / Upload PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">Private Deal Links (One-Time)</p>
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <p className="text-muted-foreground text-xs">
              Create a pre-filled link for a specific guest with custom pricing.
            </p>
            <Button size="sm" onClick={() => setPrivateLinkOpen(true)}>
              <LinkIcon />
              Generate Private Link
            </Button>
          </CardContent>
        </Card>
      </div>

      <PrivateLinkDialog
        property={property}
        open={privateLinkOpen}
        onOpenChange={setPrivateLinkOpen}
      />
    </div>
  );
}
