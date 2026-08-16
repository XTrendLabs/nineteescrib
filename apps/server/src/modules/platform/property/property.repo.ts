import { createDb } from "@propertyos/db";
import { property, roomType } from "@propertyos/db/schema/property";
import { eq } from "drizzle-orm";

const db = createDb();

export const propertyRepo = {
  listByOrganization(organizationId: string) {
    return db
      .select({
        id: property.id,
        name: property.name,
        propertyType: property.propertyType,
        city: property.city,
        status: property.status,
      })
      .from(property)
      .where(eq(property.organizationId, organizationId))
      .orderBy(property.createdAt);
  },

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
