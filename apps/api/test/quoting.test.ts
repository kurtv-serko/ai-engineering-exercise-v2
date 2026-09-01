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

    expect(quote.baseFareMinor).toBe(42_000);
    expect(quote.taxesMinor).toBe(18_600);
    expect(quote.carrierFeesMinor).toBe(7_400);
  });

  it("applies the corporate rate to the base fare only", async () => {
    const { quote } = await createQuote(db, {
      fareId: IDS.longHaulFare,
      travellerId: IDS.travellerWithDeal,
      now: FIXED_NOW,
    });

    // 12% of 42000 = 5040. If this were computed on the 68000 gross it would
    // be 8160, and we would be refunding tax we have to remit in full.
    expect(quote.negotiatedReductionMinor).toBe(5_040);
    expect(quote.payableMinor).toBe(62_960);
  });

  it("leaves the payable equal to the gross when there is no deal", async () => {
    const { quote } = await createQuote(db, {
      fareId: IDS.longHaulFare,
      travellerId: IDS.travellerNoDeal,
      now: FIXED_NOW,
    });

    expect(quote.negotiatedReductionMinor).toBe(0);
    expect(quote.payableMinor).toBe(68_000);
  });

  it("never discounts the pass-through component", async () => {
    const { quote } = await createQuote(db, {
      fareId: IDS.longHaulFare,
      travellerId: IDS.travellerWithDeal,
      now: FIXED_NOW,
    });

    const passThrough = quote.taxesMinor + quote.carrierFeesMinor;
    expect(quote.payableMinor).toBeGreaterThanOrEqual(passThrough);
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
