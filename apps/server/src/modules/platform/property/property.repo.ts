import { createDb } from "@propertyos/db";
import { property, roomType } from "@propertyos/db/schema/property";

const db = createDb();

export const propertyRepo = {
  async create(input: {
    organizationId: string;
    name: string;
    propertyType: string;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
  }) {
    const propertyId = crypto.randomUUID();

    await db.insert(property).values({
      id: propertyId,
      ...input,
    });

    await db.insert(roomType).values({
      id: crypto.randomUUID(),
      propertyId,
    });

    return { propertyId };
  },
};
