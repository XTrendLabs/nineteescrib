import { storageService } from "../storage/storage.service";
import { amenityRepo } from "./amenity.repo";
import { roomRepo } from "./room.repo";

export const roomService = {
  listByProperty(propertyId: string) {
    return roomRepo.listByProperty(propertyId);
  },

  create(input: {
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
    return roomRepo.create(input);
  },

  update(
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
    return roomRepo.update(id, input);
  },

  /**
   * Deleting the row cascades the `room_image` records away, so the stored
   * files have to be removed first or they are orphaned in object storage with
   * nothing left pointing at them.
   */
  async remove(id: string) {
    const urls = await roomRepo.listImageUrls(id);

    const removed = await roomRepo.remove(id);
    if (!removed) return undefined;

    await Promise.all(
      urls.map((url) =>
        storageService.deleteByUrl(url).catch((error) => {
          // The room is already gone; a failed cleanup should not turn a
          // successful delete into an error for the caller.
          console.error("[room] failed to delete image", url, error);
        }),
      ),
    );

    return removed;
  },

  listAmenities() {
    return amenityRepo.listAll();
  },

  async addImage(roomId: string, file: File) {
    const sortOrder = await roomRepo.countImages(roomId);
    const { url } = await storageService.uploadImage(file, [
      "rooms",
      roomId,
      "images",
    ]);
    return roomRepo.addImage(roomId, url, sortOrder);
  },

  async removeImage(imageId: string) {
    const image = await roomRepo.findImageById(imageId);
    if (!image) return undefined;

    await storageService.deleteByUrl(image.url);
    return roomRepo.removeImage(imageId);
  },
};
