/**
 * Wire contracts shared by the API and the web client.
 *
 * All amounts are integer minor units in the accompanying `currency`.
 */

import type { CurrencyCode } from "./money.js";

export type Cabin = "economy" | "premium" | "business";

export type BookingStatus = "confirmed";

export interface OrganisationView {
  id: string;
  name: string;
  /** Negotiated corporate discount, in basis points, applied to every quote. */
  negotiatedDiscountBps: number;
}

export interface TravellerView {
  id: string;
  name: string;
  email: string;
  organisation: OrganisationView;
}

export interface FareView {
  id: string;
  carrierCode: string;
  carrierName: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveAt: string;
  cabin: Cabin;
  currency: CurrencyCode;
  baseFareMinor: number;
  taxesMinor: number;
  carrierFeesMinor: number;
  /** baseFareMinor + taxesMinor + carrierFeesMinor. */
  totalMinor: number;
  seatsAvailable: number;
}

export interface QuoteView {
  id: string;
  fare: FareView;
  traveller: TravellerView;
  currency: CurrencyCode;
  baseFareMinor: number;
  taxesMinor: number;
  carrierFeesMinor: number;
  /** Gross of any reduction. */
  totalMinor: number;
  /** Corporate negotiated rate. Reduces the base fare only — see invariant D1. */
  negotiatedReductionMinor: number;
  /** What the traveller actually pays. */
  payableMinor: number;
  createdAt: string;
  expiresAt: string;
}

export interface BookingView {
  id: string;
  reference: string;
  status: BookingStatus;
  currency: CurrencyCode;
  payableMinor: number;
  confirmedAt: string;
  travellerName: string;
  fare: FareView;
}

export interface FareSearchQuery {
  origin: string;
  destination: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  cabin?: Cabin;
}

export interface CreateQuoteRequest {
  fareId: string;
  travellerId: string;
}

export interface ConfirmBookingRequest {
  quoteId: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
