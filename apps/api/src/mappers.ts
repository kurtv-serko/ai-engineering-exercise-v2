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
    baseFare: fare.baseFare,
    taxes: fare.taxes,
    carrierFees: fare.carrierFees,
    total: grossTotal(fare),
    seatsAvailable: fare.seatsAvailable,
  };
}

export function toOrganisationView(organisation: OrganisationRow): OrganisationView {
  return {
    id: organisation.id,
    name: organisation.name,
    negotiatedDiscountPercent: organisation.negotiatedDiscountPercent,
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
    baseFare: quote.baseFare,
    taxes: quote.taxes,
    carrierFees: quote.carrierFees,
    total: grossTotal(quote),
    negotiatedReduction: quote.negotiatedReduction,
    promotionCode: quote.promotionCode,
    promotionReduction: quote.promotionReduction,
    payable: quote.payable,
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
    payable: booking.payable,
    confirmedAt: booking.confirmedAt,
    travellerName,
    fare: toFareView(fare),
  };
}
