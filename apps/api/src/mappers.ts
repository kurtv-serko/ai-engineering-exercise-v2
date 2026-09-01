/** Row-to-wire mapping. Keeps database column names out of the API surface. */

import type { BookingRow, FareRow, OrganisationRow, QuoteRow, TravellerRow } from "@farepath/db";
import type { BookingView, FareView, OrganisationView, QuoteView, TravellerView } from "@farepath/shared";

import { grossTotal } from "./domain/pricing/rules.js";

export function toFareView(fare: FareRow): FareView {
  return {
    id: fare.id,
    carrierCode: fare.carrierCode,
    carrierName: fare.carrierName,
    flightNumber: fare.flightNumber,
    origin: fare.origin,
    destination: fare.destination,
    departAt: fare.departAt,
    arriveAt: fare.arriveAt,
    cabin: fare.cabin,
    currency: fare.currency,
    baseFareMinor: fare.baseFareMinor,
    taxesMinor: fare.taxesMinor,
    carrierFeesMinor: fare.carrierFeesMinor,
    totalMinor: grossTotal(fare),
    seatsAvailable: fare.seatsAvailable,
  };
}

export function toOrganisationView(organisation: OrganisationRow): OrganisationView {
  return {
    id: organisation.id,
    name: organisation.name,
    negotiatedDiscountBps: organisation.negotiatedDiscountBps,
  };
}

export function toTravellerView(
  traveller: TravellerRow,
  organisation: OrganisationRow,
): TravellerView {
  return {
    id: traveller.id,
    name: traveller.name,
    email: traveller.email,
    organisation: toOrganisationView(organisation),
  };
}

export function toQuoteView(
  quote: QuoteRow,
  fare: FareRow,
  traveller: TravellerRow,
  organisation: OrganisationRow,
): QuoteView {
  return {
    id: quote.id,
    fare: toFareView(fare),
    traveller: toTravellerView(traveller, organisation),
    currency: quote.currency,
    baseFareMinor: quote.baseFareMinor,
    taxesMinor: quote.taxesMinor,
    carrierFeesMinor: quote.carrierFeesMinor,
    totalMinor: grossTotal(quote),
    negotiatedReductionMinor: quote.negotiatedReductionMinor,
    payableMinor: quote.payableMinor,
    createdAt: quote.createdAt,
    expiresAt: quote.expiresAt,
  };
}

export function toBookingView(
  booking: BookingRow,
  fare: FareRow,
  travellerName: string,
): BookingView {
  return {
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    currency: booking.currency,
    payableMinor: booking.payableMinor,
    confirmedAt: booking.confirmedAt,
    travellerName,
    fare: toFareView(fare),
  };
}
