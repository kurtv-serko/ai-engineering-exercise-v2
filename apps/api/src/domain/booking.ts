/**
 * Booking confirmation.
 *
 * Confirming takes the seat and charges the payable amount recorded on the
 * quote. It never recomputes the price: the traveller pays what they were
 * shown, and a fare that has moved since is not their problem.
 */

import { randomUUID } from "node:crypto";

import { bookings, fares, quotes, travellers, type Db } from "@farepath/db";
import { eq, sql } from "drizzle-orm";

import {
  NoSeatsError,
  NotFoundError,
  QuoteAlreadyBookedError,
  QuoteExpiredError,
} from "../errors.js";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Six characters, no visually ambiguous glyphs. Matches the carrier format. */
function generateReference(): string {
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    const index = Math.floor(Math.random() * REFERENCE_ALPHABET.length);
    out += REFERENCE_ALPHABET[index];
  }
  return out;
}

export interface ConfirmBookingInput {
  quoteId: string;
  now?: Date;
}

export async function confirmBooking(db: Db, input: ConfirmBookingInput) {
  const now = input.now ?? new Date();

  const quote = db.select().from(quotes).where(eq(quotes.id, input.quoteId)).get();
  if (!quote) {
    throw new NotFoundError("quote", input.quoteId);
  }

  if (new Date(quote.expiresAt).getTime() <= now.getTime()) {
    throw new QuoteExpiredError(quote.id);
  }

  const existing = db
    .select()
    .from(bookings)
    .where(eq(bookings.quoteId, quote.id))
    .get();
  if (existing) {
    throw new QuoteAlreadyBookedError(quote.id);
  }

  const fare = db.select().from(fares).where(eq(fares.id, quote.fareId)).get();
  if (!fare) {
    throw new NotFoundError("fare", quote.fareId);
  }
  if (fare.seatsAvailable < 1) {
    throw new NoSeatsError(fare.id);
  }

  const row = {
    id: `bkg-${randomUUID()}`,
    reference: generateReference(),
    quoteId: quote.id,
    status: "confirmed" as const,
    currency: quote.currency,
    payable: quote.payable,
    confirmedAt: now.toISOString(),
  };

  db.transaction((tx) => {
    tx.update(fares)
      .set({ seatsAvailable: sql`${fares.seatsAvailable} - 1` })
      .where(eq(fares.id, fare.id))
      .run();
    tx.insert(bookings).values(row).run();
  });

  const traveller = db
    .select()
    .from(travellers)
    .where(eq(travellers.id, quote.travellerId))
    .get();

  return {
    booking: row,
    fare: { ...fare, seatsAvailable: fare.seatsAvailable - 1 },
    travellerName: traveller?.name ?? "Unknown traveller",
  };
}

export function listBookings(db: Db) {
  const rows = db.select().from(bookings).all();

  return rows
    .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))
    .map((booking) => hydrate(db, booking));
}

export function findBookingByReference(db: Db, reference: string) {
  const booking = db
    .select()
    .from(bookings)
    .where(eq(bookings.reference, reference.toUpperCase()))
    .get();
  if (!booking) {
    throw new NotFoundError("booking", reference);
  }
  return hydrate(db, booking);
}

function hydrate(db: Db, booking: typeof bookings.$inferSelect) {
  const quote = db.select().from(quotes).where(eq(quotes.id, booking.quoteId)).get();
  const fare = quote
    ? db.select().from(fares).where(eq(fares.id, quote.fareId)).get()
    : undefined;
  const traveller = quote
    ? db.select().from(travellers).where(eq(travellers.id, quote.travellerId)).get()
    : undefined;

  if (!fare) {
    throw new NotFoundError("fare for booking", booking.reference);
  }

  return {
    booking,
    fare,
    travellerName: traveller?.name ?? "Unknown traveller",
  };
}
