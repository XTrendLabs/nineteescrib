import { Avatar, AvatarFallback } from "@propertyos/ui/components/avatar";
import { Button } from "@propertyos/ui/components/button";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import {
  DataTable,
  DataTableContainer,
} from "@propertyos/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@propertyos/ui/components/dropdown-menu";
import { cn } from "@propertyos/ui/lib/utils";
import { MoreHorizontalIcon } from "lucide-react";
import { formatInr, formatLastStay, initials } from "../lib/format";
import type { Guest, GuestTag } from "../lib/guest";
import { TagPill } from "./tag-pill";

export function GuestsTable({
  guests,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenProfile,
  onGenerateOffer,
  onEdit,
  isLoading,
}: {
  guests: Guest[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenProfile: (guest: Guest) => void;
  onGenerateOffer: (guest: Guest) => void;
  onEdit: (guest: Guest) => void;
  isLoading?: boolean;
}) {
  const allSelected = guests.length > 0 && selectedIds.size === guests.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 border py-16 text-center">
        <p className="text-muted-foreground text-sm">Loading guests...</p>
      </div>
    );
  }

  if (guests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 border py-16 text-center">
        <p className="text-sm">No guests match your filters</p>
        <p className="text-muted-foreground text-xs">
          Try adjusting search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <DataTableContainer>
      <DataTable>
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="w-10 px-3 py-2.5">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
              />
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Guest
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Contact
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Total Stays
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Spent
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Last Stay
            </th>
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Tags
            </th>
            <th className="w-10 px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {guests.map((guest) => {
            const isSelected = selectedIds.has(guest.id);
            return (
              <tr
                key={guest.id}
                className={cn(
                  "border-b transition-colors last:border-b-0 hover:bg-muted/30",
                  isSelected && "bg-muted/40",
                )}
              >
                <td className="px-3 py-2.5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(guest.id)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenProfile(guest)}
                    className="flex items-center gap-2.5 text-left"
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{initials(guest.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-display font-medium text-foreground hover:underline">
                      {guest.name}
                    </span>
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  {/* Phone leads: it is required and is how a guest is
                      identified within an HQ, where email is optional. */}
                  <p>{guest.phone}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {guest.email ?? "—"}
                  </p>
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {guest.totalStays} {guest.totalStays === 1 ? "stay" : "stays"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-medium tabular-nums">
                  {formatInr(guest.totalSpentPaise)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {formatLastStay(guest.lastStayDate)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {guest.tags.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      guest.tags.map((tag) => (
                        <TagPill key={tag} tag={tag as GuestTag} />
                      ))
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onOpenProfile(guest)}>
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(guest)}>
                        Edit Guest
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onGenerateOffer(guest)}>
                        Generate Offer Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </DataTableContainer>
  );
}
