import { createDb } from "@propertyos/db";
import { amenity } from "@propertyos/db/schema/room";
import { asc } from "drizzle-orm";

const db = createDb();

export const amenityRepo = {
  listAll() {
    return db.select().from(amenity).orderBy(asc(amenity.name));
  },
};
