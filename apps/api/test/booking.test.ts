import { beforeEach, describe, expect, it } from "vitest";

import { fares, type Db } from "@farepath/db";
import { eq } from "drizzle-orm";

import {
  confirmBooking,
  findBookingByReference,
  listBookings,
} from "../src/domain/booking.js";
import { createQuote } from "../src/domain/quoting.js";
import {
  NoSeatsError,
  NotFoundError,
  QuoteAlreadyBookedError,
  QuoteExpiredError,
} from "../src/errors.js";
import { FIXED_NOW, IDS, makeTestDb } from "./support/harness.js";

let db: Db;

beforeEach(() => {
  db = makeTestDb();
});

async function quoteFor(fareId: string, travellerId = IDS.travellerWithDeal) {
  const { quote } = await createQuote(db, { fareId, travellerId, now: FIXED_NOW });
  return quote;
}

describe("confirmBooking", () => {
  it("charges exactly what the quote said", async () => {
    const quote = await quoteFor(IDS.longHaulFare);
    const { booking } = await confirmBooking(db, { quoteId: quote.id, now: FIXED_NOW });

    expect(booking.payable).toBe(quote.payable);
    expect(booking.payable).toBe(629.6);
    expect(booking.status).toBe("confirmed");
  });

  it("issues a six character reference", async () => {
    const quote = await quoteFor(IDS.longHaulFare);
    const { booking } = await confirmBooking(db, { quoteId: quote.id, now: FIXED_NOW });

    expect(booking.reference).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });

  it("takes a seat off the fare", async () => {
    const quote = await quoteFor(IDS.longHaulFare);
    await confirmBooking(db, { quoteId: quote.id, now: FIXED_NOW });

    const fare = db.select().from(fares).where(eq(fares.id, IDS.longHaulFare)).get();
    expect(fare?.seatsAvailable).toBe(30);
  });

  it("refuses to book the same quote twice", async () => {
    const quote = await quoteFor(IDS.longHaulFare);
    await confirmBooking(db, { quoteId: quote.id, now: FIXED_NOW });

    await expect(
      confirmBooking(db, { quoteId: quote.id, now: FIXED_NOW }),
    ).rejects.toBeInstanceOf(QuoteAlreadyBookedError);
  });

  it("does not take a second seat when the second attempt fails", async () => {
    const quote = await quoteFor(IDS.longHaulFare);
    await confirmBooking(db, { quoteId: quote.id, now: FIXED_NOW });
    await confirmBooking(db, { quoteId: quote.id, now: FIXED_NOW }).catch(() => {});

    const fare = db.select().from(fares).where(eq(fares.id, IDS.longHaulFare)).get();
    expect(fare?.seatsAvailable).toBe(30);
  });

  it("refuses an expired quote", async () => {
    const quote = await quoteFor(IDS.longHaulFare);
    const tooLate = new Date(new Date(quote.expiresAt).getTime() + 1_000);

    await expect(
      confirmBooking(db, { quoteId: quote.id, now: tooLate }),
    ).rejects.toBeInstanceOf(QuoteExpiredError);
  });

  it("refuses an unknown quote", async () => {
    await expect(
      confirmBooking(db, { quoteId: "qte-nope", now: FIXED_NOW }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses when the fare has no seats left", async () => {
    const first = await quoteFor(IDS.lastSeatFare);
    const second = await quoteFor(IDS.lastSeatFare, IDS.travellerNoDeal);

    await confirmBooking(db, { quoteId: first.id, now: FIXED_NOW });

    await expect(
      confirmBooking(db, { quoteId: second.id, now: FIXED_NOW }),
    ).rejects.toBeInstanceOf(NoSeatsError);
  });
});

describe("reading bookings back", () => {
  it("finds a booking by reference, case insensitively", async () => {
    const quote = await quoteFor(IDS.longHaulFare);
    const { booking } = await confirmBooking(db, { quoteId: quote.id, now: FIXED_NOW });

    const found = findBookingByReference(db, booking.reference.toLowerCase());
    expect(found.booking.id).toBe(booking.id);
    expect(found.travellerName).toBe("Mereana Walker");
  });

  it("raises for an unknown reference", () => {
    expect(() => findBookingByReference(db, "ZZZZZZ")).toThrow(NotFoundError);
  });

  it("lists bookings newest first", async () => {
    const earlier = await quoteFor(IDS.longHaulFare);
    const later = await quoteFor(IDS.domesticFare, IDS.travellerNoDeal);

    await confirmBooking(db, { quoteId: earlier.id, now: FIXED_NOW });
    await confirmBooking(db, {
      quoteId: later.id,
      now: new Date(FIXED_NOW.getTime() + 60_000),
    });

    const listed = listBookings(db);
    expect(listed).toHaveLength(2);
    expect(listed[0]?.booking.quoteId).toBe(later.id);
    expect(listed[1]?.booking.quoteId).toBe(earlier.id);
  });
});
