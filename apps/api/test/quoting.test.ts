import { beforeEach, describe, expect, it } from "vitest";

import type { Db } from "@farepath/db";

import { NotFoundError } from "../src/errors.js";
import { createQuote, QUOTE_TTL_MINUTES, searchFares } from "../src/domain/quoting.js";
import { FIXED_NOW, IDS, makeTestDb } from "./support/harness.js";

let db: Db;

beforeEach(() => {
  db = makeTestDb();
});

describe("createQuote", () => {
  it("copies the fare components onto the quote", async () => {
    const { quote } = await createQuote(db, {
      fareId: IDS.longHaulFare,
      travellerId: IDS.travellerNoDeal,
      now: FIXED_NOW,
    });

    expect(quote.baseFare).toBe(420);
    expect(quote.taxes).toBe(186);
    expect(quote.carrierFees).toBe(74);
  });

  it("applies the corporate rate to the base fare only", async () => {
    const { quote } = await createQuote(db, {
      fareId: IDS.longHaulFare,
      travellerId: IDS.travellerWithDeal,
      now: FIXED_NOW,
    });

    // 12% of 420 = 50.4. If this were computed on the 680 gross it would be
    // 81.6, and we would be refunding tax we have to remit in full.
    expect(quote.negotiatedReduction).toBe(50.4);
    expect(quote.payable).toBe(629.6);
  });

  it("leaves the payable equal to the gross when there is no deal", async () => {
    const { quote } = await createQuote(db, {
      fareId: IDS.longHaulFare,
      travellerId: IDS.travellerNoDeal,
      now: FIXED_NOW,
    });

    expect(quote.negotiatedReduction).toBe(0);
    expect(quote.payable).toBe(680);
  });

  it("never discounts the pass-through component", async () => {
    const { quote } = await createQuote(db, {
      fareId: IDS.longHaulFare,
      travellerId: IDS.travellerWithDeal,
      now: FIXED_NOW,
    });

    const passThrough = quote.taxes + quote.carrierFees;
    expect(quote.payable).toBeGreaterThanOrEqual(passThrough);
  });

  it("expires the quote after the TTL", async () => {
    const { quote } = await createQuote(db, {
      fareId: IDS.domesticFare,
      travellerId: IDS.travellerNoDeal,
      now: FIXED_NOW,
    });

    const elapsedMs =
      new Date(quote.expiresAt).getTime() - new Date(quote.createdAt).getTime();
    expect(elapsedMs).toBe(QUOTE_TTL_MINUTES * 60_000);
  });

  it("rejects an unknown fare", async () => {
    await expect(
      createQuote(db, {
        fareId: "fare-does-not-exist",
        travellerId: IDS.travellerNoDeal,
        now: FIXED_NOW,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects an unknown traveller", async () => {
    await expect(
      createQuote(db, {
        fareId: IDS.longHaulFare,
        travellerId: "trv-nobody",
        now: FIXED_NOW,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("searchFares", () => {
  it("matches on route and date", () => {
    const results = searchFares(db, {
      origin: "AKL",
      destination: "LAX",
      date: "2026-03-10",
    });

    expect(results.map((f) => f.id)).toEqual([IDS.longHaulFare]);
  });

  it("is case insensitive on airport codes", () => {
    const results = searchFares(db, {
      origin: "akl",
      destination: "lax",
      date: "2026-03-10",
    });

    expect(results).toHaveLength(1);
  });

  it("returns nothing for a date with no departures", () => {
    const results = searchFares(db, {
      origin: "AKL",
      destination: "LAX",
      date: "2026-03-11",
    });

    expect(results).toEqual([]);
  });

  it("filters by cabin", () => {
    const results = searchFares(db, {
      origin: "AKL",
      destination: "SIN",
      date: "2026-03-10",
      cabin: "economy",
    });

    expect(results).toEqual([]);
  });
});
