import { AppError } from "../../core";
import { bookingService } from "../platform/booking/booking.service";
import { publicRepo } from "./public.repo";
import type { PublicBookingInput } from "./public.schema";

/**
 * What a stay costs, from the room's own rates.
 *
 * Computed here rather than trusted from the request: the public site is
 * unauthenticated, so a price in the payload is a price the guest chose.
 * Friday and Saturday nights take the weekend rate, matching the front desk's
 * quote so the same stay does not cost two different amounts depending on who
 * booked it.
 */
function quoteStay(input: {
  checkIn: string;
  checkOut: string;
  weekdayPrice: number;
  weekendPrice: number;
}) {
  const start = new Date(`${input.checkIn}T00:00:00`);
  const end = new Date(`${input.checkOut}T00:00:00`);

  let totalRupees = 0;
  let nights = 0;

  for (
    const cursor = new Date(start);
    cursor < end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const day = cursor.getDay();
    const isWeekend = day === 5 || day === 6;
    totalRupees += isWeekend ? input.weekendPrice : input.weekdayPrice;
    nights++;
  }

  // Room prices are stored in whole rupees; bookings are stored in paise.
  return { nights, totalPaise: totalRupees * 100 };
}

/** A property that is actually open to public bookings, or a 404. */
async function resolveProperty(slug: string) {
  const property = await publicRepo.findPropertyBySlug(slug);

  if (property?.kind !== "property") {
    throw AppError.notFound("This booking page is not available");
  }

  // A property is always created under an HQ; one without is malformed, and
  // a booking could not be filed anywhere.
  const { hqOrganizationId } = property;
  if (!hqOrganizationId) {
    throw AppError.notFound("This booking page is not available");
  }

  // Rebuilt rather than returned as-is so the narrowing above survives: the
  // inferred type of `property` still admits a null HQ.
  return { ...property, hqOrganizationId };
}

export const publicService = {
  async getProperty(slug: string) {
    const property = await resolveProperty(slug);
    return {
      id: property.id,
      name: property.name,
      slug: property.slug,
    };
  },

  async listAvailability(
    slug: string,
    input: { checkIn: string; checkOut: string; guests?: number },
  ) {
    const property = await resolveProperty(slug);

    const rooms = await publicRepo.listAvailableRooms({
      propertyId: property.id,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    });

    const guests = input.guests ?? 1;

    return {
      property: {
        id: property.id,
        name: property.name,
        slug: property.slug,
      },
      rooms: rooms
        // A room that cannot seat the party is not an option, so it is left
        // out rather than shown and refused at the last step.
        .filter((room) => room.maxGuests >= guests)
        .map((room) => {
          const quote = quoteStay({
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            weekdayPrice: room.weekdayPrice,
            weekendPrice: room.weekendPrice,
          });

          return {
            id: room.id,
            name: room.name,
            roomType: room.roomType,
            maxGuests: room.maxGuests,
            nights: quote.nights,
            totalPaise: quote.totalPaise,
          };
        }),
    };
  },

  async listOccupancy(slug: string, input: { from: string; to: string }) {
    const property = await resolveProperty(slug);
    return publicRepo.listNightlyOccupancy({
      propertyId: property.id,
      from: input.from,
      to: input.to,
    });
  },

  /**
   * Books a room from the public site.
   *
   * Goes through the same service the front desk uses, so the availability
   * check, the guest dedupe and the POS-n reference all behave identically --
   * a public booking is an ordinary booking that happens to have no member
   * behind it. `createdByUserId` is null for exactly that reason.
   *
   * Payment is not taken here. Until a gateway is wired the booking is left
   * unpaid, which is honest: the money has not moved, and recording a payment
   * that never happened would put the balance out by the full amount.
   */
  async createBooking(slug: string, input: PublicBookingInput) {
    const property = await resolveProperty(slug);

    const room = await publicRepo.findRoom({
      propertyId: property.id,
      roomId: input.roomId,
    });

    if (room?.status !== "published") {
      throw AppError.notFound("That room is not available to book");
    }

    if (room.maxGuests < input.guestCount) {
      throw AppError.validation(`${room.name} sleeps up to ${room.maxGuests}`);
    }

    const quote = quoteStay({
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      weekdayPrice: room.weekdayPrice,
      weekendPrice: room.weekendPrice,
    });

    const notes = [
      input.arrivalTime ? `Arriving ${input.arrivalTime}` : "",
      input.specialRequests?.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    const created = await bookingService.create(
      property.hqOrganizationId,
      // No member made this booking; the column is nullable for this case.
      null,
      {
        propertyId: property.id,
        roomId: input.roomId,
        kind: "reservation",
        source: "direct",
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guestCount: input.guestCount,
        totalAmountPaise: quote.totalPaise,
        notes,
        guest: {
          name: input.guest.name,
          phone: input.guest.phone,
          email: input.guest.email || undefined,
        },
      },
    );

    if (!created) {
      throw new Error("Booking was created but could not be read back");
    }

    // Only what a stranger may see: the rest of the booking row carries other
    // guests' context that a public response has no business exposing.
    return {
      ref: created.ref,
      checkIn: created.checkIn,
      checkOut: created.checkOut,
      guestCount: created.guestCount,
      totalAmountPaise: created.totalAmountPaise,
      roomName: room.name,
      propertyName: property.name,
    };
  },
};
