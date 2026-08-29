import { Checkbox } from "@propertyos/ui/components/checkbox";
import { Label } from "@propertyos/ui/components/label";
import { LoadingButton } from "@propertyos/ui/components/loading-button";
import { Skeleton } from "@propertyos/ui/components/skeleton";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { useEffect, useState } from "react";

import { useProperties } from "@/features/properties/api/use-properties";
import { api } from "@/shared/lib/api-client";
import { useUpdateStaffProperties } from "../api/use-update-staff-properties";
import type { Staff } from "../lib/staff";

/**
 * Assigns a staff member to properties. Saves through its own endpoint rather
 * than the details patch, so the membership reconcile only runs when the
 * assignments actually change.
 */
export function StaffPropertiesTab({
  staff,
  hqOrganizationId,
}: {
  staff: Staff;
  hqOrganizationId: string;
}) {
  const feedback = useFeedback();
  const { data: response, isPending: isLoadingProperties } =
    useProperties(hqOrganizationId);
  const properties = response?.data ?? [];
  const updateProperties = useUpdateStaffProperties();

  const assigned = staff.properties.map((property) => property.id);
  const [selected, setSelected] = useState<string[]>(assigned);

  // Re-sync when the member's saved assignments change underneath us.
  useEffect(() => {
    setSelected(staff.properties.map((property) => property.id));
  }, [staff.properties]);

  const isDirty =
    selected.length !== assigned.length ||
    selected.some((id) => !assigned.includes(id));

  function toggle(propertyId: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...current, propertyId]
        : current.filter((id) => id !== propertyId),
    );
  }

  async function save() {
    const added = selected.filter((id) => !assigned.includes(id)).length;
    const removed = assigned.filter((id) => !selected.includes(id)).length;

    try {
      await updateProperties.mutateAsync({
        param: { id: staff.id },
        json: { propertyIds: selected },
      });
      await Promise.all([
        api.api.platform.staff[":id"].$get.invalidate({
          param: { id: staff.id },
        }),
        api.api.platform.staff.$get.invalidate({
          query: { hqOrganizationId },
        }),
      ]);

      const changes = [
        added > 0 &&
          `assigned to ${added} ${added === 1 ? "property" : "properties"}`,
        removed > 0 &&
          `removed from ${removed} ${removed === 1 ? "property" : "properties"}`,
      ].filter(Boolean);

      feedback.success(
        "Properties updated",
        `${staff.fullName} has been ${changes.join(" and ")}.`,
      );
    } catch {
      feedback.error(
        "Couldn't update properties",
        "Something went wrong. Please try again.",
      );
    }
  }

  if (isLoadingProperties) {
    return (
      <div className="flex flex-col gap-2">
        {["a", "b", "c"].map((key) => (
          <Skeleton key={key} className="h-9" />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No properties yet. Create one first to assign access.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col divide-y border">
        {properties.map((property) => (
          <Label
            key={property.id}
            className="flex cursor-pointer items-center gap-2.5 p-3 font-normal hover:bg-muted/50"
          >
            <Checkbox
              checked={selected.includes(property.id)}
              onCheckedChange={(checked) =>
                toggle(property.id, checked === true)
              }
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm">{property.name}</span>
              {property.city && (
                <span className="truncate text-[11px] text-muted-foreground">
                  {property.city}
                </span>
              )}
            </span>
          </Label>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs">
          {selected.length} of {properties.length} selected
        </span>
        <LoadingButton
          size="sm"
          disabled={!isDirty}
          loading={updateProperties.isPending}
          onClick={save}
        >
          Save Assignments
        </LoadingButton>
      </div>
    </div>
  );
}
