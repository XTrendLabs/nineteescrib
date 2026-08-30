import { createDb } from "@propertyos/db";
import { user } from "@propertyos/db/schema/auth";
import {
  booking,
  guest,
  guestNote,
  guestTag,
} from "@propertyos/db/schema/booking";
import { organization } from "@propertyos/db/schema/organization";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";

const db = createDb();

/**
 * The stay history the guests page aggregates over.
 *
 * Cancelled bookings are excluded: a guest who booked and cancelled has not
 * stayed, and counting it would overstate both their visit count and their
 * lifetime value. Blocks carry no guest at all, so they never appear here.
 */
function countableStays() {
  return and(ne(booking.status, "cancelled"), eq(booking.kind, "reservation"));
}

/**
 * Per-guest rollups: visit count, lifetime spend, and the most recent stay.
 *
 * Computed on read rather than cached on `guest`. These change on every
 * booking, payment and cancellation, so a stored copy would need invalidating
 * from four different places and would be wrong the first time one was missed.
 */
async function attachStats(guestIds: string[]) {
  if (guestIds.length === 0) return new Map<string, GuestStats>();

  const rows = await db
    .select({
      guestId: booking.guestId,
      totalStays: sql<number>`count(*)::int`,
      totalSpentPaise: sql<number>`coalesce(sum(${booking.totalAmountPaise}), 0)`,
      lastStayDate: sql<string | null>`max(${booking.checkIn})`,
    })
    .from(booking)
    .where(and(inArray(booking.guestId, guestIds), countableStays()))
    .groupBy(booking.guestId);

  const stats = new Map<string, GuestStats>();
  for (const row of rows) {
    if (!row.guestId) continue;
    stats.set(row.guestId, {
      totalStays: row.totalStays,
      totalSpentPaise: row.totalSpentPaise,
      lastStayDate: row.lastStayDate,
    });
  }
  return stats;
}

type GuestStats = {
  totalStays: number;
  totalSpentPaise: number;
  lastStayDate: string | null;
};

/**
 * The tags on a set of guests.
 *
 * "repeat" is not stored -- it is added here from the stay count, so it can
 * never disagree with the bookings behind it. The other tags are judgements a
 * person made, so they come from the table.
 */
async function attachTags(guestIds: string[]) {
  if (guestIds.length === 0) return new Map<string, string[]>();

  const rows = await db
    .select({ guestId: guestTag.guestId, tag: guestTag.tag })
    .from(guestTag)
    .where(inArray(guestTag.guestId, guestIds));

  const tags = new Map<string, string[]>();
  for (const row of rows) {
    const existing = tags.get(row.guestId);
    if (existing) {
      existing.push(row.tag);
    } else {
      tags.set(row.guestId, [row.tag]);
    }
  }
  return tags;
}

/** Stored tags plus the derived "repeat", in a stable order. */
function resolveTags(stored: string[] | undefined, totalStays: number) {
  const tags = [...(stored ?? [])];
  if (totalStays > 1) tags.push("repeat");
  return tags;
}

const EMPTY_STATS: GuestStats = {
  totalStays: 0,
  totalSpentPaise: 0,
  lastStayDate: null,
};

export const guestRepo = {
  async listByHqOrganization(hqOrganizationId: string) {
    const rows = await db
      .select()
      .from(guest)
      .where(eq(guest.hqOrganizationId, hqOrganizationId))
      .orderBy(asc(guest.name));

    const ids = rows.map((r) => r.id);
    const [stats, tags] = await Promise.all([
      attachStats(ids),
      attachTags(ids),
    ]);

    return rows.map((row) => {
      const rowStats = stats.get(row.id) ?? EMPTY_STATS;
      return {
        ...row,
        ...rowStats,
        tags: resolveTags(tags.get(row.id), rowStats.totalStays),
      };
    });
  },

  async findById(id: string) {
    const [row] = await db
      .select()
      .from(guest)
      .where(eq(guest.id, id))
      .limit(1);
    if (!row) return undefined;

    const [stats, tags] = await Promise.all([
      attachStats([row.id]),
      attachTags([row.id]),
    ]);

    const rowStats = stats.get(row.id) ?? EMPTY_STATS;
    return {
      ...row,
      ...rowStats,
      tags: resolveTags(tags.get(row.id), rowStats.totalStays),
    };
  },

  /** The guest's stays, newest first -- the profile drawer's timeline. */
  async listStays(guestId: string) {
    return db
      .select({
        id: booking.id,
        ref: booking.ref,
        propertyName: organization.name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        status: booking.status,
        totalAmountPaise: booking.totalAmountPaise,
      })
      .from(booking)
      .innerJoin(organization, eq(booking.organizationId, organization.id))
      .where(and(eq(booking.guestId, guestId), eq(booking.kind, "reservation")))
      .orderBy(desc(booking.checkIn));
  },

  async findByPhone(hqOrganizationId: string, phone: string) {
    const [row] = await db
      .select()
      .from(guest)
      .where(
        and(
          eq(guest.hqOrganizationId, hqOrganizationId),
          eq(guest.phone, phone),
        ),
      )
      .limit(1);
    return row;
  },

  /**
   * Resolves the guest for a booking, creating them on first contact.
   *
   * Phone is the identity within an HQ, so the upsert targets that unique
   * index: two concurrent bookings for the same person converge on one row
   * instead of racing to insert a duplicate. A repeat guest's name and email
   * are refreshed from what was typed this time -- the latest booking is the
   * best evidence of how to reach them -- but a blank email never overwrites
   * one already on file.
   */
  async findOrCreate(input: {
    hqOrganizationId: string;
    name: string;
    phone: string;
    email?: string | null;
  }) {
    const [row] = await db
      .insert(guest)
      .values({
        id: crypto.randomUUID(),
        hqOrganizationId: input.hqOrganizationId,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
      })
      .onConflictDoUpdate({
        target: [guest.hqOrganizationId, guest.phone],
        set: {
          name: input.name,
          email: sql`coalesce(${input.email ?? null}, ${guest.email})`,
        },
      })
      .returning();

    if (!row) {
      throw new Error("Could not resolve the guest for this booking");
    }

    return row;
  },

  /**
   * Adds a guest to the directory directly.
   *
   * Unlike `findOrCreate`, a duplicate phone is an error rather than a silent
   * merge: someone filling in this form believes they are adding a new person,
   * so quietly overwriting an existing profile's name would be wrong. The
   * caller turns the conflict into a message naming who already holds it.
   */
  async create(input: {
    hqOrganizationId: string;
    name: string;
    phone: string;
    email?: string | null;
  }) {
    const [row] = await db
      .insert(guest)
      .values({
        id: crypto.randomUUID(),
        hqOrganizationId: input.hqOrganizationId,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
      })
      .onConflictDoNothing({
        target: [guest.hqOrganizationId, guest.phone],
      })
      .returning();

    // Nothing came back, so the unique index absorbed the insert -- this phone
    // already belongs to someone in this HQ.
    return row;
  },

  async update(
    id: string,
    input: Partial<Pick<typeof guest.$inferInsert, "name" | "phone" | "email">>,
  ) {
    const rows = await db
      .update(guest)
      .set(input)
      .where(eq(guest.id, id))
      .returning({ id: guest.id });

    if (rows.length === 0) return undefined;
    return guestRepo.findById(id);
  },

  /**
   * Adds a tag. Idempotent: tagging someone VIP twice is the same fact, so a
   * repeat call is absorbed rather than failing on the primary key.
   */
  async addTag(guestId: string, tag: string, taggedByUserId: string) {
    await db
      .insert(guestTag)
      .values({ guestId, tag, taggedByUserId })
      .onConflictDoNothing();
  },

  async removeTag(guestId: string, tag: string) {
    const [row] = await db
      .delete(guestTag)
      .where(and(eq(guestTag.guestId, guestId), eq(guestTag.tag, tag)))
      .returning({ tag: guestTag.tag });
    return row;
  },

  async listNotes(guestId: string) {
    return db
      .select({
        id: guestNote.id,
        text: guestNote.text,
        authorUserId: guestNote.authorUserId,
        authorName: user.name,
        createdAt: guestNote.createdAt,
      })
      .from(guestNote)
      .leftJoin(user, eq(guestNote.authorUserId, user.id))
      .where(eq(guestNote.guestId, guestId))
      .orderBy(desc(guestNote.createdAt));
  },

  async addNote(guestId: string, text: string, authorUserId: string) {
    const [row] = await db
      .insert(guestNote)
      .values({ id: crypto.randomUUID(), guestId, text, authorUserId })
      .returning();
    return row;
  },

  async removeNote(noteId: string) {
    const [row] = await db
      .delete(guestNote)
      .where(eq(guestNote.id, noteId))
      .returning({ id: guestNote.id });
    return row;
  },

  /** The guest a note belongs to, so a note id can be scope-checked. */
  async findGuestIdByNote(noteId: string) {
    const [row] = await db
      .select({ guestId: guestNote.guestId })
      .from(guestNote)
      .where(eq(guestNote.id, noteId))
      .limit(1);
    return row?.guestId;
  },

  /** The HQ owning a guest, for the scope check. */
  async findHqOrganizationId(id: string) {
    const [row] = await db
      .select({ hqOrganizationId: guest.hqOrganizationId })
      .from(guest)
      .where(eq(guest.id, id))
      .limit(1);
    return row?.hqOrganizationId;
  },
};
