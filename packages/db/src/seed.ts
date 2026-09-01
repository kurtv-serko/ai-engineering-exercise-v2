/**
 * Deterministic dev seed.
 *
 * Departure dates are generated relative to today so the app always has
 * bookable flights, however long the checkout sits on a shelf. Everything else
 * is fixed, so screenshots and test expectations stay stable.
 *
 * The fare amounts are deliberately realistic: on long haul, taxes and carrier
 * fees are a large fraction of the ticket price.
 */

import type { Db } from "./client.js";
import { bookings, fares, organisations, quotes, travellers } from "./schema.js";

type Cabin = "economy" | "premium" | "business";
type Currency = "NZD" | "AUD" | "USD" | "GBP";

interface RouteTemplate {
  carrierCode: string;
  carrierName: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departHour: number;
  durationMinutes: number;
  cabin: Cabin;
  currency: Currency;
  baseFareMinor: number;
  taxesMinor: number;
  carrierFeesMinor: number;
  seatsAvailable: number;
}

const ROUTES: RouteTemplate[] = [
  // Trans-Tasman. Moderate tax load.
  {
    carrierCode: "NZ",
    carrierName: "Air New Zealand",
    flightNumber: "NZ103",
    origin: "AKL",
    destination: "SYD",
    departHour: 7,
    durationMinutes: 235,
    cabin: "economy",
    currency: "NZD",
    baseFareMinor: 24_900,
    taxesMinor: 8_650,
    carrierFeesMinor: 3_200,
    seatsAvailable: 14,
  },
  {
    carrierCode: "NZ",
    carrierName: "Air New Zealand",
    flightNumber: "NZ107",
    origin: "AKL",
    destination: "SYD",
    departHour: 14,
    durationMinutes: 240,
    cabin: "business",
    currency: "NZD",
    baseFareMinor: 98_000,
    taxesMinor: 14_200,
    carrierFeesMinor: 5_800,
    seatsAvailable: 4,
  },
  {
    carrierCode: "QF",
    carrierName: "Qantas",
    flightNumber: "QF142",
    origin: "AKL",
    destination: "SYD",
    departHour: 10,
    durationMinutes: 230,
    cabin: "economy",
    currency: "NZD",
    baseFareMinor: 22_400,
    taxesMinor: 8_650,
    carrierFeesMinor: 4_100,
    seatsAvailable: 22,
  },
  // Long haul. Tax and fees are most of the ticket — this is where invariant
  // D1 has teeth.
  {
    carrierCode: "NZ",
    carrierName: "Air New Zealand",
    flightNumber: "NZ2",
    origin: "AKL",
    destination: "LAX",
    departHour: 19,
    durationMinutes: 760,
    cabin: "economy",
    currency: "NZD",
    baseFareMinor: 42_000,
    taxesMinor: 18_600,
    carrierFeesMinor: 7_400,
    seatsAvailable: 31,
  },
  {
    carrierCode: "NZ",
    carrierName: "Air New Zealand",
    flightNumber: "NZ6",
    origin: "AKL",
    destination: "LAX",
    departHour: 21,
    durationMinutes: 755,
    cabin: "premium",
    currency: "NZD",
    baseFareMinor: 89_500,
    taxesMinor: 21_400,
    carrierFeesMinor: 9_100,
    seatsAvailable: 8,
  },
  {
    carrierCode: "SQ",
    carrierName: "Singapore Airlines",
    flightNumber: "SQ282",
    origin: "AKL",
    destination: "SIN",
    departHour: 12,
    durationMinutes: 620,
    cabin: "economy",
    currency: "NZD",
    baseFareMinor: 51_000,
    taxesMinor: 16_900,
    carrierFeesMinor: 6_300,
    seatsAvailable: 19,
  },
  {
    carrierCode: "SQ",
    carrierName: "Singapore Airlines",
    flightNumber: "SQ286",
    origin: "AKL",
    destination: "SIN",
    departHour: 23,
    durationMinutes: 615,
    cabin: "business",
    currency: "NZD",
    baseFareMinor: 184_000,
    taxesMinor: 24_800,
    carrierFeesMinor: 11_200,
    seatsAvailable: 3,
  },
  // Domestic. Almost no tax, and a cheap base fare.
  {
    carrierCode: "NZ",
    carrierName: "Air New Zealand",
    flightNumber: "NZ431",
    origin: "AKL",
    destination: "WLG",
    departHour: 6,
    durationMinutes: 65,
    cabin: "economy",
    currency: "NZD",
    baseFareMinor: 8_900,
    taxesMinor: 1_100,
    carrierFeesMinor: 900,
    seatsAvailable: 40,
  },
  {
    carrierCode: "JQ",
    carrierName: "Jetstar",
    flightNumber: "JQ253",
    origin: "AKL",
    destination: "WLG",
    departHour: 16,
    durationMinutes: 70,
    cabin: "economy",
    currency: "NZD",
    baseFareMinor: 5_400,
    taxesMinor: 1_100,
    carrierFeesMinor: 1_600,
    seatsAvailable: 55,
  },
  {
    carrierCode: "QF",
    carrierName: "Qantas",
    flightNumber: "QF44",
    origin: "SYD",
    destination: "AKL",
    departHour: 9,
    durationMinutes: 195,
    cabin: "economy",
    currency: "NZD",
    baseFareMinor: 26_100,
    taxesMinor: 9_400,
    carrierFeesMinor: 3_800,
    seatsAvailable: 17,
  },
];

/** Flights are seeded for this many days starting tomorrow. */
const DAYS_OF_SCHEDULE = 14;

function isoDayOffset(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoAt(date: string, hour: number, plusMinutes = 0): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCMinutes(d.getUTCMinutes() + hour * 60 + plusMinutes);
  return d.toISOString();
}

export function seed(db: Db): void {
  db.delete(bookings).run();
  db.delete(quotes).run();
  db.delete(fares).run();
  db.delete(travellers).run();
  db.delete(organisations).run();

  db.insert(organisations)
    .values([
      // Large negotiated rate. Makes the discount basis visible in the UI.
      { id: "org-kahu", name: "Kahu Logistics", negotiatedDiscountBps: 1_200 },
      { id: "org-northwind", name: "Northwind Freight", negotiatedDiscountBps: 500 },
      // No corporate deal. Useful for checking the zero-discount path.
      { id: "org-tuatara", name: "Tuatara Studios", negotiatedDiscountBps: 0 },
    ])
    .run();

  db.insert(travellers)
    .values([
      {
        id: "trv-mereana",
        name: "Mereana Walker",
        email: "mereana.walker@kahulogistics.example",
        organisationId: "org-kahu",
      },
      {
        id: "trv-daniel",
        name: "Daniel Okafor",
        email: "daniel.okafor@kahulogistics.example",
        organisationId: "org-kahu",
      },
      {
        id: "trv-priya",
        name: "Priya Raman",
        email: "priya.raman@northwindfreight.example",
        organisationId: "org-northwind",
      },
      {
        id: "trv-sam",
        name: "Sam Whitcombe",
        email: "sam@tuatarastudios.example",
        organisationId: "org-tuatara",
      },
    ])
    .run();

  const fareRows = [];
  for (let day = 1; day <= DAYS_OF_SCHEDULE; day += 1) {
    const date = isoDayOffset(day);
    for (const route of ROUTES) {
      fareRows.push({
        id: `fare-${route.flightNumber}-${date}`,
        carrierCode: route.carrierCode,
        carrierName: route.carrierName,
        flightNumber: route.flightNumber,
        origin: route.origin,
        destination: route.destination,
        departAt: isoAt(date, route.departHour),
        arriveAt: isoAt(date, route.departHour, route.durationMinutes),
        cabin: route.cabin,
        currency: route.currency,
        baseFareMinor: route.baseFareMinor,
        taxesMinor: route.taxesMinor,
        carrierFeesMinor: route.carrierFeesMinor,
        seatsAvailable: route.seatsAvailable,
      });
    }
  }

  db.insert(fares).values(fareRows).run();
}
