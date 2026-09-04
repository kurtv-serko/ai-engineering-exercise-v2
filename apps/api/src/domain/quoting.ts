/**
 * Quoting.
 *
 * A quote freezes the price of one fare for one traveller for a short window.
 * Prices are copied onto the quote rather than read through to the fare, so a
 * fare repricing cannot change what a traveller was shown.
 */

import { randomUUID } from "node:crypto";

import { fares, organisations, quotes, travellers, type Db } from "@farepath/db";
import { and, eq } from "drizzle-orm";

import { NotFoundError } from "../errors.js";
import {
  applyReduction,
  grossTotal,
  negotiatedReduction,
  type PricedItinerary,
} from "./pricing/rules.js";

/** How long a quote is honoured for. */
export const QUOTE_TTL_MINUTES = 30;

export interface CreateQuoteInput {
  fareId: string;
  travellerId: string;
  now?: Date;
}

export async function createQuote(db: Db, input: CreateQuoteInput) {
  const now = input.now ?? new Date();

  const fare = db.select().from(fares).where(eq(fares.id, input.fareId)).get();
  if (!fare) {
    throw new NotFoundError("fare", input.fareId);
  }

  const traveller = db
    .select()
    .from(travellers)
    .where(eq(travellers.id, input.travellerId))
    .get();
  if (!traveller) {
    throw new NotFoundError("traveller", input.travellerId);
  }

  const organisation = db
    .select()
    .from(organisations)
    .where(eq(organisations.id, traveller.organisationId))
    .get();
  if (!organisation) {
    throw new NotFoundError("organisation", traveller.organisationId);
  }

  const itinerary: PricedItinerary = {
    baseFare: fare.baseFare,
    taxes: fare.taxes,
    carrierFees: fare.carrierFees,
  };

  // Contractual corporate rate. Applied first — see invariant D3 in
  // pricing/rules.ts. Note this reduces the base fare only.
  const negotiated = negotiatedReduction(itinerary, organisation.negotiatedDiscountPercent);
  const payable = applyReduction(itinerary, negotiated);

  const expiresAt = new Date(now.getTime() + QUOTE_TTL_MINUTES * 60_000);

  const row = {
    id: `qte-${randomUUID()}`,
    fareId: fare.id,
    travellerId: traveller.id,
    currency: fare.currency,
    baseFare: itinerary.baseFare,
    taxes: itinerary.taxes,
    carrierFees: itinerary.carrierFees,
    negotiatedReduction: negotiated,
    promotionCode: null,
    promotionReduction: 0,
    payable,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  db.insert(quotes).values(row).run();

  return { quote: row, fare, traveller, organisation };
}

export async function findQuote(db: Db, quoteId: string) {
  const quote = db.select().from(quotes).where(eq(quotes.id, quoteId)).get();
  if (!quote) {
    throw new NotFoundError("quote", quoteId);
  }

  const fare = db.select().from(fares).where(eq(fares.id, quote.fareId)).get();
  const traveller = db
    .select()
    .from(travellers)
    .where(eq(travellers.id, quote.travellerId))
    .get();
  if (!fare || !traveller) {
    throw new NotFoundError("quote", quoteId);
  }

  const organisation = db
    .select()
    .from(organisations)
    .where(eq(organisations.id, traveller.organisationId))
    .get();
  if (!organisation) {
    throw new NotFoundError("organisation", traveller.organisationId);
  }

  return { quote, fare, traveller, organisation };
}

export interface FareSearch {
  origin: string;
  destination: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  cabin?: "economy" | "premium" | "business";
}

export function searchFares(db: Db, search: FareSearch) {
  const conditions = [
    eq(fares.origin, search.origin.toUpperCase()),
    eq(fares.destination, search.destination.toUpperCase()),
  ];
  if (search.cabin) {
    conditions.push(eq(fares.cabin, search.cabin));
  }

  const candidates = db
    .select()
    .from(fares)
    .where(and(...conditions))
    .all();

  return candidates
    .filter((fare) => fare.departAt.slice(0, 10) === search.date)
    .sort((a, b) => a.departAt.localeCompare(b.departAt));
}

/** Convenience for callers that want the priced shape without the row noise. */
export function itineraryOf(row: PricedItinerary): PricedItinerary & { total: number } {
  return { ...row, total: grossTotal(row) };
}
