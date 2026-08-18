import { Button } from "@propertyos/ui/components/button";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import { Input } from "@propertyos/ui/components/input";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type {
  Amenity,
  AmenityCategory,
  PropertyDetail,
} from "../../lib/mock-data";

const CATEGORY_LABELS: Record<AmenityCategory, string> = {
  essentials: "Essentials",
  kitchen: "Kitchen & Dining",
  outdoor: "Outdoor & Recreation",
  safety: "Safety & Security",
  parking: "Parking & Transport",
  views: "Views & Surroundings",
};

const CATEGORY_ORDER: AmenityCategory[] = [
  "essentials",
  "kitchen",
  "outdoor",
  "safety",
  "parking",
  "views",
];

export function AmenitiesTab({ property }: { property: PropertyDetail }) {
  const [amenities, setAmenities] = useState<Amenity[]>(property.amenities);
  const [newCustom, setNewCustom] = useState("");

  function toggle(key: string) {
    setAmenities((prev) =>
      prev.map((a) => (a.key === key ? { ...a, enabled: !a.enabled } : a)),
    );
  }

  function addCustom() {
    const label = newCustom.trim();
    if (!label) return;
    setAmenities((prev) => [
      ...prev,
      {
        key: `custom:${label.toLowerCase().replace(/\s+/g, "_")}-${Date.now()}`,
        label,
        category: "essentials",
        enabled: true,
        custom: true,
      },
    ]);
    setNewCustom("");
  }

  function removeCustom(key: string) {
    setAmenities((prev) => prev.filter((a) => a.key !== key));
  }

  const standard = amenities.filter((a) => !a.custom);
  const custom = amenities.filter((a) => a.custom);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">Amenities</p>
        <Button
          size="sm"
          onClick={() =>
            toast.success("Amenities saved", {
              description: `Amenities updated for ${property.name}.`,
            })
          }
        >
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {CATEGORY_ORDER.map((category) => (
          <div key={category} className="flex flex-col gap-2">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {CATEGORY_LABELS[category]}
            </p>
            <div className="flex flex-col gap-1.5">
              {standard
                .filter((a) => a.category === category)
                .map((amenity) => (
                  <button
                    key={amenity.key}
                    type="button"
                    onClick={() => toggle(amenity.key)}
                    className="flex items-center gap-2 text-left text-xs"
                  >
                    <Checkbox checked={amenity.enabled} tabIndex={-1} />
                    {amenity.label}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Custom Amenities
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {custom.map((amenity) => (
            <span
              key={amenity.key}
              className="flex items-center gap-1 border bg-muted/30 px-2 py-1 text-xs"
            >
              {amenity.label}
              <button type="button" onClick={() => removeCustom(amenity.key)}>
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex max-w-sm items-center gap-1.5">
          <Input
            value={newCustom}
            onChange={(e) => setNewCustom(e.target.value)}
            placeholder="e.g. Private Chef Available"
          />
          <Button variant="outline" size="icon-sm" onClick={addCustom}>
            <PlusIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
