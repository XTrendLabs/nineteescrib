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

  remove(id: string) {
    return roomRepo.remove(id);
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
