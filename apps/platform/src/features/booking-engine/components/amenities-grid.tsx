import {
  CarIcon,
  ChefHatIcon,
  CircleDotIcon,
  ShieldCheckIcon,
  SnowflakeIcon,
  WifiIcon,
  ZapIcon,
} from "lucide-react";

import type { Amenity } from "@/features/properties/lib/mock-data";

const AMENITY_ICONS: Record<string, typeof WifiIcon> = {
  wifi: WifiIcon,
  ac: SnowflakeIcon,
  free_parking: CarIcon,
  kitchen: ChefHatIcon,
  power_backup: ZapIcon,
  security_guard: ShieldCheckIcon,
};

export function AmenitiesGrid({ amenities }: { amenities: Amenity[] }) {
  return (
    <div className="flex flex-row flex-wrap gap-1.5">
      {amenities.map((amenity) => {
        const Icon = AMENITY_ICONS[amenity.key] ?? CircleDotIcon;
        return (
          <div
            key={amenity.key}
            className="flex w-20 flex-col items-center justify-center gap-1 border p-2 text-center"
          >
            <Icon className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] leading-tight">{amenity.label}</span>
          </div>
        );
      })}
    </div>
  );
}
