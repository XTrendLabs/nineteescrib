import { Button } from "@propertyos/ui/components/button";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { Skeleton } from "@propertyos/ui/components/skeleton";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { useProperties } from "@/features/properties/api/use-properties";
import {
  normalizeStaffRole,
  STAFF_ROLE_LABEL,
  type Staff,
  type StaffRole,
  staffRoleValues,
} from "../lib/staff";
import { StaffCard } from "./staff-card";

export function StaffDirectory({
  staff,
  hqOrganizationId,
  isLoading,
  onAddClick,
  onEdit,
  onDelete,
}: {
  staff: Staff[];
  hqOrganizationId: string | undefined;
  isLoading: boolean;
  onAddClick: () => void;
  onEdit: (member: Staff) => void;
  onDelete: (member: Staff) => void;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">("all");
  const [propertyFilter, setPropertyFilter] = useState("all");

  const { data: propertiesResponse } = useProperties(hqOrganizationId);
  const properties = propertiesResponse?.data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((member) => {
      if (
        roleFilter !== "all" &&
        normalizeStaffRole(member.role) !== roleFilter
      ) {
        return false;
      }
      if (
        propertyFilter !== "all" &&
        !member.properties.some((p) => p.id === propertyFilter)
      ) {
        return false;
      }
      if (
        query &&
        !member.fullName.toLowerCase().includes(query) &&
        !member.phone.includes(query) &&
        !(member.email ?? "").toLowerCase().includes(query)
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
            placeholder="Search staff by name, phone, email..."
            className="pl-8"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as StaffRole | "all")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter Role">
              {roleFilter === "all"
                ? "All Roles"
                : STAFF_ROLE_LABEL[roleFilter]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {staffRoleValues.map((role) => (
              <SelectItem key={role} value={role}>
                {STAFF_ROLE_LABEL[role]}
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
                : (properties.find((p) => p.id === propertyFilter)?.name ??
                  "All Properties")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onAddClick}>
          <PlusIcon />
          Add Staff
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {["a", "b", "c"].map((key) => (
            <Skeleton key={key} className="h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground text-sm">
            {staff.length === 0
              ? "No staff members yet."
              : "No staff match your filters."}
          </p>
          {staff.length === 0 && (
            <Button onClick={onAddClick}>
              <PlusIcon />
              Add your first staff member
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member) => (
            <StaffCard
              key={member.id}
              staff={member}
              onEdit={() => onEdit(member)}
              onDelete={() => onDelete(member)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
