import { createDb } from "@propertyos/db";
import { member, organization } from "@propertyos/db/schema/organization";
import { propertyDetails } from "@propertyos/db/schema/property";
import { room } from "@propertyos/db/schema/room";
import { and, count, eq } from "drizzle-orm";

const db = createDb();

export const hqRepo = {
  /** The HQ organizations this user belongs to. */
  listForUser(userId: string) {
    return db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        role: member.role,
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(and(eq(member.userId, userId), eq(organization.kind, "hq")));
  },

  /** Every property under an HQ, with a room count for the overview cards. */
  listProperties(hqOrganizationId: string) {
    return db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        propertyType: propertyDetails.propertyType,
        city: propertyDetails.city,
        state: propertyDetails.state,
        status: propertyDetails.status,
        coverImage: propertyDetails.coverImage,
        roomCount: count(room.id),
      })
      .from(organization)
      .innerJoin(
        propertyDetails,
        eq(propertyDetails.organizationId, organization.id),
      )
      .leftJoin(room, eq(room.organizationId, organization.id))
      .where(eq(organization.parentOrganizationId, hqOrganizationId))
      .groupBy(
        organization.id,
        organization.name,
        organization.slug,
        organization.logo,
        propertyDetails.propertyType,
        propertyDetails.city,
        propertyDetails.state,
        propertyDetails.status,
        propertyDetails.coverImage,
      )
      .orderBy(organization.name);
  },
};
