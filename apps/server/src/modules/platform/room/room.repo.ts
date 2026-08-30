import { createDb } from "@propertyos/db";
import { booking } from "@propertyos/db/schema/booking";
import {
  amenity,
  room,
  roomAmenity,
  roomImage,
} from "@propertyos/db/schema/room";
import { asc, eq, inArray } from "drizzle-orm";

const db = createDb();

async function attachRelations<T extends { id: string }>(rooms: T[]) {
  if (rooms.length === 0) return [];

  const roomIds = rooms.map((r) => r.id);
  const [links, images] = await Promise.all([
    db
      .select({
        roomId: roomAmenity.roomId,
        amenityId: amenity.id,
        name: amenity.name,
        icon: amenity.icon,
      })
      .from(roomAmenity)
      .innerJoin(amenity, eq(roomAmenity.amenityId, amenity.id))
      .where(inArray(roomAmenity.roomId, roomIds)),
    db
      .select()
      .from(roomImage)
      .where(inArray(roomImage.roomId, roomIds))
      .orderBy(asc(roomImage.sortOrder)),
  ]);

  return rooms.map((r) => ({
    ...r,
    amenities: links
      .filter((l) => l.roomId === r.id)
      .map((l) => ({ id: l.amenityId, name: l.name, icon: l.icon })),
    images: images.filter((i) => i.roomId === r.id),
  }));
}

export const roomRepo = {
  async listByProperty(propertyId: string) {
    const rows = await db
      .select()
      .from(room)
      .where(eq(room.organizationId, propertyId))
      .orderBy(room.createdAt);
    return attachRelations(rows);
  },

  async findById(id: string) {
    const [result] = await db
      .select()
      .from(room)
      .where(eq(room.id, id))
      .limit(1);
    if (!result) return undefined;
    const [withRelations] = await attachRelations([result]);
    return withRelations;
  },

  async create(input: {
    propertyId: string;
    name: string;
    roomNumber?: string;
    floor?: string;
    roomType?: string;
    status?: string;
    weekdayPrice?: number;
    weekendPrice?: number;
    maxGuests?: number;
    amenityIds?: string[];
  }) {
    const roomId = crypto.randomUUID();
    // A property *is* an organization, so the room hangs off the property's
    // organization id.
    const { amenityIds, propertyId, ...roomInput } = input;

    await db
      .insert(room)
      .values({ id: roomId, organizationId: propertyId, ...roomInput });

    if (amenityIds && amenityIds.length > 0) {
      await db
        .insert(roomAmenity)
        .values(amenityIds.map((amenityId) => ({ roomId, amenityId })));
    }

    return roomRepo.findById(roomId);
  },

  async update(
    id: string,
    input: {
      name: string;
      roomNumber?: string;
      floor?: string;
      roomType: string;
      status?: string;
      weekdayPrice: number;
      weekendPrice: number;
      maxGuests: number;
      amenityIds?: string[];
    },
  ) {
    const { amenityIds, ...roomInput } = input;

    const rows = await db
      .update(room)
      .set(roomInput)
      .where(eq(room.id, id))
      .returning();
    if (rows.length === 0) return undefined;

    if (amenityIds) {
      await db.delete(roomAmenity).where(eq(roomAmenity.roomId, id));
      if (amenityIds.length > 0) {
        await db
          .insert(roomAmenity)
          .values(amenityIds.map((amenityId) => ({ roomId: id, amenityId })));
      }
    }

    return roomRepo.findById(id);
  },

  /** Image URLs for a room, so stored files can be cleaned up on delete. */
  listImageUrls(roomId: string) {
    return db
      .select({ url: roomImage.url })
      .from(roomImage)
      .where(eq(roomImage.roomId, roomId))
      .then((rows) => rows.map((row) => row.url));
  },

  /**
   * Whether any stay still points at this room.
   *
   * `booking.roomId` is `onDelete: restrict`, so deleting a room with history
   * fails at the database with a raw foreign-key error. Checking first lets the
   * caller say something useful instead. Cancelled bookings still count: they
   * are kept as history, and that history has to keep resolving to a room.
   */
  async countBookings(roomId: string) {
    const rows = await db
      .select({ id: booking.id })
      .from(booking)
      .where(eq(booking.roomId, roomId))
      .limit(1);
    return rows.length;
  },

  async remove(id: string) {
    const rows = await db.delete(room).where(eq(room.id, id)).returning();
    return rows[0];
  },

  async addImage(roomId: string, url: string, sortOrder: number) {
    const [inserted] = await db
      .insert(roomImage)
      .values({ id: crypto.randomUUID(), roomId, url, sortOrder })
      .returning();
    return inserted;
  },

  async removeImage(imageId: string) {
    const rows = await db
      .delete(roomImage)
      .where(eq(roomImage.id, imageId))
      .returning();
    return rows[0];
  },

  async findImageById(imageId: string) {
    const [result] = await db
      .select()
      .from(roomImage)
      .where(eq(roomImage.id, imageId))
      .limit(1);
    return result;
  },

  async countImages(roomId: string) {
    const rows = await db
      .select({ id: roomImage.id })
      .from(roomImage)
      .where(eq(roomImage.roomId, roomId));
    return rows.length;
  },
};
