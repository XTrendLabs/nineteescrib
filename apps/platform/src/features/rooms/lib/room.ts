export const roomTypeValues = [
  "single",
  "double",
  "twin",
  "deluxe",
  "suite",
  "dormitory",
  "entire_property",
  "other",
] as const;

export type RoomType = (typeof roomTypeValues)[number];

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  single: "Single",
  double: "Double",
  twin: "Twin",
  deluxe: "Deluxe",
  suite: "Suite",
  dormitory: "Dormitory",
  entire_property: "Entire Property",
  other: "Other",
};

export const roomStatusValues = ["draft", "published"] as const;
export type RoomStatus = (typeof roomStatusValues)[number];

export type Amenity = {
  id: string;
  name: string;
  icon: string;
};

export type RoomImage = {
  id: string;
  roomId: string;
  url: string;
  sortOrder: number;
  createdAt: string;
};

export type Room = {
  id: string;
  /** The property's organization id. */
  organizationId: string;
  name: string;
  roomNumber: string | null;
  floor: string | null;
  roomType: string;
  status: string;
  weekdayPrice: number;
  weekendPrice: number;
  maxGuests: number;
  createdAt: string;
  updatedAt: string;
  amenities: Amenity[];
  images: RoomImage[];
};

export function normalizeRoomType(value: string): RoomType {
  return roomTypeValues.includes(value as RoomType)
    ? (value as RoomType)
    : "other";
}
