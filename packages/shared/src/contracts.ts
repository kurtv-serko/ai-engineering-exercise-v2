/**
 * Wire contracts shared by the API and the web client.
 *
 * All amounts are decimal amounts in the accompanying `currency`, e.g. `420` is
 * four hundred and twenty dollars.
 */

import type { CurrencyCode } from "./money.js";

export type Cabin = "economy" | "premium" | "business";

export type BookingStatus = "confirmed";

export interface AirportView {
  code: string;
  city: string;
  country: string;
}

/** One direction of one route. */
export interface RoutePairView {
  origin: string;
  destination: string;
}

/** Everything the search form needs to offer only routes that exist. */
export interface NetworkView {
  airports: AirportView[];
  routes: RoutePairView[];
}

export interface OrganisationView {
  id: string;
  name: string;
  /** Negotiated corporate discount, as a plain percentage, applied to every quote. */
  negotiatedDiscountPercent: number;
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
  baseFare: number;
  taxes: number;
  carrierFees: number;
  /** baseFare + taxes + carrierFees. */
  total: number;
  seatsAvailable: number;
}

export interface QuoteView {
  id: string;
  fare: FareView;
  traveller: TravellerView;
  currency: CurrencyCode;
  baseFare: number;
  taxes: number;
  carrierFees: number;
  /** Gross of any reduction. */
  total: number;
  /** Corporate negotiated rate. Reduces the base fare only — see invariant D1. */
  negotiatedReduction: number;
  /** The promotion code applied to this quote, if any. */
  promotionCode: string | null;
  /** The reduction that promotion produced. */
  promotionReduction: number;
  /** What the traveller actually pays. */
  payable: number;
  createdAt: string;
  expiresAt: string;
}

export interface BookingView {
  id: string;
  reference: string;
  status: BookingStatus;
  currency: CurrencyCode;
  payable: number;
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

export interface ApplyPromotionRequest {
  code: string;
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
