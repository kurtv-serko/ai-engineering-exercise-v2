/**
 * Deterministic dev seed.
 *
 * Departure dates are generated relative to today so the app always has
 * bookable flights, however long the checkout sits on a shelf. Everything else
 * is fixed, so screenshots and test expectations stay stable.
 *
 * Fare amounts are deliberately realistic, and the pass-through share varies a
 * lot by route: on a domestic hop taxes and carrier fees are under a fifth of
 * the ticket, and on long haul they are more than a third. That spread is why
 * it matters which amount a discount is applied to.
 */

import type { Db } from "./client.js";
import {
  bookings,
  fares,
  organisations,
  quotes,
  travellers,
} from "./schema.js";

type Cabin = "economy" | "premium" | "business";
type Currency = "NZD" | "AUD" | "USD" | "GBP";

export interface Airport {
  code: string;
  city: string;
  country: string;
}

/** Every airport the network touches. */
export const AIRPORTS: Airport[] = [
  { code: "AKL", city: "Auckland", country: "New Zealand" },
  { code: "WLG", city: "Wellington", country: "New Zealand" },
  { code: "CHC", city: "Christchurch", country: "New Zealand" },
  { code: "ZQN", city: "Queenstown", country: "New Zealand" },
  { code: "SYD", city: "Sydney", country: "Australia" },
  { code: "MEL", city: "Melbourne", country: "Australia" },
  { code: "BNE", city: "Brisbane", country: "Australia" },
  { code: "PER", city: "Perth", country: "Australia" },
  { code: "NAN", city: "Nadi", country: "Fiji" },
  { code: "RAR", city: "Rarotonga", country: "Cook Islands" },
  { code: "SIN", city: "Singapore", country: "Singapore" },
  { code: "HKG", city: "Hong Kong", country: "Hong Kong SAR" },
  { code: "NRT", city: "Tokyo Narita", country: "Japan" },
  { code: "LAX", city: "Los Angeles", country: "United States" },
  { code: "SFO", city: "San Francisco", country: "United States" },
  { code: "YVR", city: "Vancouver", country: "Canada" },
  { code: "LHR", city: "London Heathrow", country: "United Kingdom" },
];

interface Service {
  carrierCode: string;
  carrierName: string;
  /** Outbound number. The return leg is this plus one, as carriers do. */
  flightNumber: number;
  departHour: number;
  cabin: Cabin;
  baseFareMinor: number;
  seatsAvailable: number;
}

interface Route {
  origin: string;
  destination: string;
  durationMinutes: number;
  /** Statutory taxes, per passenger. Pass-through, remitted in full. */
  taxesMinor: number;
  /** Carrier-imposed surcharges. Also pass-through. */
  carrierFeesMinor: number;
  services: Service[];
}

const NZ = { carrierCode: "NZ", carrierName: "Air New Zealand" } as const;
const QF = { carrierCode: "QF", carrierName: "Qantas" } as const;
const JQ = { carrierCode: "JQ", carrierName: "Jetstar" } as const;
const SQ = { carrierCode: "SQ", carrierName: "Singapore Airlines" } as const;
const CX = { carrierCode: "CX", carrierName: "Cathay Pacific" } as const;
const FJ = { carrierCode: "FJ", carrierName: "Fiji Airways" } as const;
const UA = { carrierCode: "UA", carrierName: "United Airlines" } as const;

/**
 * Outbound routes. Every one is also seeded in reverse — see `reverseOf`.
 *
 * Currency is NZD throughout: the booking currency follows the corporate
 * account, not the route.
 */
const ROUTES: Route[] = [
  // ---- New Zealand domestic. Small base fare, very small pass-through. ----
  {
    origin: "AKL",
    destination: "WLG",
    durationMinutes: 65,
    taxesMinor: 1_100,
    carrierFeesMinor: 900,
    services: [
      { ...NZ, flightNumber: 431, departHour: 6, cabin: "economy", baseFareMinor: 8_900, seatsAvailable: 40 },
      { ...JQ, flightNumber: 253, departHour: 16, cabin: "economy", baseFareMinor: 5_400, seatsAvailable: 55 },
    ],
  },
  {
    origin: "AKL",
    destination: "CHC",
    durationMinutes: 80,
    taxesMinor: 1_100,
    carrierFeesMinor: 900,
    services: [
      { ...NZ, flightNumber: 501, departHour: 7, cabin: "economy", baseFareMinor: 9_600, seatsAvailable: 38 },
      { ...NZ, flightNumber: 509, departHour: 17, cabin: "business", baseFareMinor: 24_500, seatsAvailable: 8 },
    ],
  },
  {
    origin: "AKL",
    destination: "ZQN",
    durationMinutes: 105,
    taxesMinor: 1_200,
    carrierFeesMinor: 1_000,
    services: [
      { ...NZ, flightNumber: 611, departHour: 8, cabin: "economy", baseFareMinor: 14_200, seatsAvailable: 26 },
    ],
  },
  {
    origin: "WLG",
    destination: "CHC",
    durationMinutes: 45,
    taxesMinor: 900,
    carrierFeesMinor: 800,
    services: [
      { ...NZ, flightNumber: 421, departHour: 9, cabin: "economy", baseFareMinor: 7_200, seatsAvailable: 44 },
    ],
  },

  // ---- Trans-Tasman. Moderate pass-through. ----
  {
    origin: "AKL",
    destination: "SYD",
    durationMinutes: 235,
    taxesMinor: 8_650,
    carrierFeesMinor: 3_200,
    services: [
      { ...NZ, flightNumber: 103, departHour: 7, cabin: "economy", baseFareMinor: 24_900, seatsAvailable: 14 },
      { ...NZ, flightNumber: 107, departHour: 14, cabin: "business", baseFareMinor: 98_000, seatsAvailable: 4 },
      { ...QF, flightNumber: 142, departHour: 10, cabin: "economy", baseFareMinor: 22_400, seatsAvailable: 22 },
    ],
  },
  {
    origin: "AKL",
    destination: "MEL",
    durationMinutes: 265,
    taxesMinor: 8_650,
    carrierFeesMinor: 3_400,
    services: [
      { ...NZ, flightNumber: 121, departHour: 9, cabin: "economy", baseFareMinor: 27_600, seatsAvailable: 19 },
      { ...QF, flightNumber: 164, departHour: 15, cabin: "economy", baseFareMinor: 25_900, seatsAvailable: 12 },
    ],
  },
  {
    origin: "AKL",
    destination: "BNE",
    durationMinutes: 210,
    taxesMinor: 8_400,
    carrierFeesMinor: 3_100,
    services: [
      { ...NZ, flightNumber: 139, departHour: 11, cabin: "economy", baseFareMinor: 23_100, seatsAvailable: 21 },
    ],
  },
  {
    origin: "CHC",
    destination: "SYD",
    durationMinutes: 195,
    taxesMinor: 8_650,
    carrierFeesMinor: 3_000,
    services: [
      { ...NZ, flightNumber: 537, departHour: 8, cabin: "economy", baseFareMinor: 21_800, seatsAvailable: 17 },
    ],
  },

  // ---- Australian domestic. ----
  {
    origin: "SYD",
    destination: "MEL",
    durationMinutes: 85,
    taxesMinor: 4_200,
    carrierFeesMinor: 2_100,
    services: [
      { ...QF, flightNumber: 412, departHour: 7, cabin: "economy", baseFareMinor: 11_900, seatsAvailable: 48 },
    ],
  },
  {
    origin: "SYD",
    destination: "PER",
    durationMinutes: 300,
    taxesMinor: 5_600,
    carrierFeesMinor: 2_600,
    services: [
      { ...QF, flightNumber: 645, departHour: 9, cabin: "economy", baseFareMinor: 29_800, seatsAvailable: 23 },
    ],
  },

  // ---- Pacific. ----
  {
    origin: "AKL",
    destination: "NAN",
    durationMinutes: 185,
    taxesMinor: 11_200,
    carrierFeesMinor: 4_800,
    services: [
      { ...FJ, flightNumber: 410, departHour: 12, cabin: "economy", baseFareMinor: 33_500, seatsAvailable: 28 },
    ],
  },
  {
    origin: "AKL",
    destination: "RAR",
    durationMinutes: 240,
    taxesMinor: 9_800,
    carrierFeesMinor: 4_200,
    services: [
      { ...NZ, flightNumber: 44, departHour: 14, cabin: "economy", baseFareMinor: 41_200, seatsAvailable: 15 },
    ],
  },

  // ---- Asia. Pass-through is a third of a cheap ticket. ----
  {
    origin: "AKL",
    destination: "SIN",
    durationMinutes: 620,
    taxesMinor: 16_900,
    carrierFeesMinor: 6_300,
    services: [
      { ...SQ, flightNumber: 282, departHour: 12, cabin: "economy", baseFareMinor: 51_000, seatsAvailable: 19 },
      { ...SQ, flightNumber: 286, departHour: 23, cabin: "business", baseFareMinor: 184_000, seatsAvailable: 3 },
    ],
  },
  {
    origin: "AKL",
    destination: "HKG",
    durationMinutes: 690,
    taxesMinor: 17_400,
    carrierFeesMinor: 6_600,
    services: [
      { ...CX, flightNumber: 198, departHour: 22, cabin: "economy", baseFareMinor: 54_800, seatsAvailable: 25 },
      { ...NZ, flightNumber: 87, departHour: 19, cabin: "premium", baseFareMinor: 96_500, seatsAvailable: 9 },
    ],
  },
  {
    origin: "AKL",
    destination: "NRT",
    durationMinutes: 655,
    taxesMinor: 15_800,
    carrierFeesMinor: 6_100,
    services: [
      { ...NZ, flightNumber: 99, departHour: 20, cabin: "economy", baseFareMinor: 57_300, seatsAvailable: 18 },
    ],
  },
  {
    origin: "SYD",
    destination: "SIN",
    durationMinutes: 480,
    taxesMinor: 14_600,
    carrierFeesMinor: 5_700,
    services: [
      { ...SQ, flightNumber: 232, departHour: 13, cabin: "economy", baseFareMinor: 44_900, seatsAvailable: 30 },
    ],
  },

  // ---- Long haul. Pass-through is a large slice of the ticket. ----
  {
    origin: "AKL",
    destination: "LAX",
    durationMinutes: 760,
    taxesMinor: 18_600,
    carrierFeesMinor: 7_400,
    services: [
      { ...NZ, flightNumber: 2, departHour: 19, cabin: "economy", baseFareMinor: 42_000, seatsAvailable: 31 },
      { ...NZ, flightNumber: 6, departHour: 21, cabin: "premium", baseFareMinor: 89_500, seatsAvailable: 8 },
    ],
  },
  {
    origin: "AKL",
    destination: "SFO",
    durationMinutes: 730,
    taxesMinor: 18_200,
    carrierFeesMinor: 7_200,
    services: [
      { ...NZ, flightNumber: 8, departHour: 20, cabin: "economy", baseFareMinor: 44_600, seatsAvailable: 22 },
      { ...UA, flightNumber: 916, departHour: 18, cabin: "economy", baseFareMinor: 46_900, seatsAvailable: 27 },
    ],
  },
  {
    origin: "AKL",
    destination: "YVR",
    durationMinutes: 800,
    taxesMinor: 17_900,
    carrierFeesMinor: 7_000,
    services: [
      { ...NZ, flightNumber: 22, departHour: 17, cabin: "economy", baseFareMinor: 48_300, seatsAvailable: 20 },
    ],
  },
  {
    origin: "SYD",
    destination: "LAX",
    durationMinutes: 840,
    taxesMinor: 19_400,
    carrierFeesMinor: 7_800,
    services: [
      { ...QF, flightNumber: 11, departHour: 10, cabin: "economy", baseFareMinor: 51_500, seatsAvailable: 26 },
    ],
  },
  {
    origin: "AKL",
    destination: "LHR",
    durationMinutes: 1_500,
    taxesMinor: 31_000,
    carrierFeesMinor: 9_800,
    services: [
      { ...NZ, flightNumber: 16, departHour: 16, cabin: "economy", baseFareMinor: 128_900, seatsAvailable: 12 },
      { ...NZ, flightNumber: 18, departHour: 13, cabin: "business", baseFareMinor: 412_000, seatsAvailable: 2 },
    ],
  },
];

/**
 * The return leg of a route.
 *
 * The aircraft turns around and comes back, so the flight number is the
 * outbound number plus one and the departure is twelve hours later in the day.
 */
function reverseOf(route: Route): Route {
  return {
    origin: route.destination,
    destination: route.origin,
    durationMinutes: route.durationMinutes,
    taxesMinor: route.taxesMinor,
    carrierFeesMinor: route.carrierFeesMinor,
    services: route.services.map((service) => ({
      ...service,
      flightNumber: service.flightNumber + 1,
      departHour: (service.departHour + 12) % 24,
    })),
  };
}

/** Flights are seeded for this many days, starting tomorrow. */
const DAYS_OF_SCHEDULE = 21;

const CURRENCY: Currency = "NZD";

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

/** Every route, in both directions. */
export function allRoutes(): Route[] {
  return ROUTES.flatMap((route) => [route, reverseOf(route)]);
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
      { id: "org-harbourline", name: "Harbourline Legal", negotiatedDiscountBps: 750 },
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
        id: "trv-tomas",
        name: "Tomás Ferreira",
        email: "tomas.ferreira@northwindfreight.example",
        organisationId: "org-northwind",
      },
      {
        id: "trv-aroha",
        name: "Aroha Ngata",
        email: "aroha.ngata@harbourlinelegal.example",
        organisationId: "org-harbourline",
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
    for (const route of allRoutes()) {
      for (const service of route.services) {
        const flightNumber = `${service.carrierCode}${service.flightNumber}`;
        fareRows.push({
          id: `fare-${flightNumber}-${date}`,
          carrierCode: service.carrierCode,
          carrierName: service.carrierName,
          flightNumber,
          origin: route.origin,
          destination: route.destination,
          departAt: isoAt(date, service.departHour),
          arriveAt: isoAt(date, service.departHour, route.durationMinutes),
          cabin: service.cabin,
          currency: CURRENCY,
          baseFareMinor: service.baseFareMinor,
          taxesMinor: route.taxesMinor,
          carrierFeesMinor: route.carrierFeesMinor,
          seatsAvailable: service.seatsAvailable,
        });
      }
    }
  }

  db.insert(fares).values(fareRows).run();
}
