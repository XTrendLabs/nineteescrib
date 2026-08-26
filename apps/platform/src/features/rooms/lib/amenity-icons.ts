import {
  BathIcon,
  CarIcon,
  CoffeeIcon,
  ConciergeBellIcon,
  CookingPotIcon,
  DoorOpenIcon,
  DropletIcon,
  type LucideIcon,
  RefrigeratorIcon,
  SnowflakeIcon,
  TvIcon,
  WavesIcon,
  WifiIcon,
} from "lucide-react";

export const AMENITY_ICONS: Record<string, LucideIcon> = {
  snowflake: SnowflakeIcon,
  tv: TvIcon,
  wifi: WifiIcon,
  droplet: DropletIcon,
  "door-open": DoorOpenIcon,
  refrigerator: RefrigeratorIcon,
  bath: BathIcon,
  "concierge-bell": ConciergeBellIcon,
  car: CarIcon,
  coffee: CoffeeIcon,
  waves: WavesIcon,
  "cooking-pot": CookingPotIcon,
};

export function getAmenityIcon(icon: string): LucideIcon {
  return AMENITY_ICONS[icon] ?? SnowflakeIcon;
}
