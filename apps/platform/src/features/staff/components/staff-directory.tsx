import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  MOCK_PROPERTIES,
  ROLE_LABELS,
  type StaffMember,
  type StaffRole,
} from "../lib/mock-data";
import { InviteNewStaffCard } from "./invite-new-staff-card";
import { StaffCard } from "./staff-card";

export function StaffDirectory({
  staff,
  onInviteClick,
}: {
  staff: StaffMember[];
  onInviteClick: () => void;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((member) => {
      if (roleFilter !== "all" && member.role !== roleFilter) {
        return false;
      }
      if (
        propertyFilter !== "all" &&
        member.primaryPropertyId !== propertyFilter &&
        member.primaryPropertyId !== "all"
      ) {
        return false;
      }
      if (
        query &&
        !member.fullName.toLowerCase().includes(query) &&
        !member.phone.includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [staff, search, roleFilter, propertyFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, phone..."
            className="pl-8"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as StaffRole | "all")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter Role">
              {roleFilter === "all" ? "All Roles" : ROLE_LABELS[roleFilter]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={propertyFilter}
          onValueChange={(v) => setPropertyFilter(v as string)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter Property">
              {propertyFilter === "all"
                ? "All Properties"
                : (MOCK_PROPERTIES.find((p) => p.id === propertyFilter)?.name ??
                  "All Properties")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {MOCK_PROPERTIES.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((member) => (
          <StaffCard key={member.id} staff={member} />
        ))}
        <InviteNewStaffCard onClick={onInviteClick} />
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-muted-foreground text-sm">
          No staff match your filters.
        </p>
      )}
    </div>
  );
}
