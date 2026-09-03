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
  baseFare: number;
  seatsAvailable: number;
}

interface Route {
  origin: string;
  destination: string;
  durationMinutes: number;
  /** Statutory taxes, per passenger. Pass-through, remitted in full. */
  taxes: number;
  /** Carrier-imposed surcharges. Also pass-through. */
  carrierFees: number;
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
    taxes: 11,
    carrierFees: 9,
    services: [
      { ...NZ, flightNumber: 431, departHour: 6, cabin: "economy", baseFare: 89, seatsAvailable: 40 },
      { ...JQ, flightNumber: 253, departHour: 16, cabin: "economy", baseFare: 54, seatsAvailable: 55 },
    ],
  },
  {
    origin: "AKL",
    destination: "CHC",
    durationMinutes: 80,
    taxes: 11,
    carrierFees: 9,
    services: [
      { ...NZ, flightNumber: 501, departHour: 7, cabin: "economy", baseFare: 96, seatsAvailable: 38 },
      { ...NZ, flightNumber: 509, departHour: 17, cabin: "business", baseFare: 245, seatsAvailable: 8 },
    ],
  },
  {
    origin: "AKL",
    destination: "ZQN",
    durationMinutes: 105,
    taxes: 12,
    carrierFees: 10,
    services: [
      { ...NZ, flightNumber: 611, departHour: 8, cabin: "economy", baseFare: 142, seatsAvailable: 26 },
    ],
  },
  {
    origin: "WLG",
    destination: "CHC",
    durationMinutes: 45,
    taxes: 9,
    carrierFees: 8,
    services: [
      { ...NZ, flightNumber: 421, departHour: 9, cabin: "economy", baseFare: 72, seatsAvailable: 44 },
    ],
  },

  // ---- Trans-Tasman. Moderate pass-through. ----
  {
    origin: "AKL",
    destination: "SYD",
    durationMinutes: 235,
    taxes: 86.5,
    carrierFees: 32,
    services: [
      { ...NZ, flightNumber: 103, departHour: 7, cabin: "economy", baseFare: 249, seatsAvailable: 14 },
      { ...NZ, flightNumber: 107, departHour: 14, cabin: "business", baseFare: 980, seatsAvailable: 4 },
      { ...QF, flightNumber: 142, departHour: 10, cabin: "economy", baseFare: 224, seatsAvailable: 22 },
    ],
  },
  {
    origin: "AKL",
    destination: "MEL",
    durationMinutes: 265,
    taxes: 86.5,
    carrierFees: 34,
    services: [
      { ...NZ, flightNumber: 121, departHour: 9, cabin: "economy", baseFare: 276, seatsAvailable: 19 },
      { ...QF, flightNumber: 164, departHour: 15, cabin: "economy", baseFare: 259, seatsAvailable: 12 },
    ],
  },
  {
    origin: "AKL",
    destination: "BNE",
    durationMinutes: 210,
    taxes: 84,
    carrierFees: 31,
    services: [
      { ...NZ, flightNumber: 139, departHour: 11, cabin: "economy", baseFare: 231, seatsAvailable: 21 },
    ],
  },
  {
    origin: "CHC",
    destination: "SYD",
    durationMinutes: 195,
    taxes: 86.5,
    carrierFees: 30,
    services: [
      { ...NZ, flightNumber: 537, departHour: 8, cabin: "economy", baseFare: 218, seatsAvailable: 17 },
    ],
  },

  // ---- Australian domestic. ----
  {
    origin: "SYD",
    destination: "MEL",
    durationMinutes: 85,
    taxes: 42,
    carrierFees: 21,
    services: [
      { ...QF, flightNumber: 412, departHour: 7, cabin: "economy", baseFare: 119, seatsAvailable: 48 },
    ],
  },
  {
    origin: "SYD",
    destination: "PER",
    durationMinutes: 300,
    taxes: 56,
    carrierFees: 26,
    services: [
      { ...QF, flightNumber: 645, departHour: 9, cabin: "economy", baseFare: 298, seatsAvailable: 23 },
    ],
  },

  // ---- Pacific. ----
  {
    origin: "AKL",
    destination: "NAN",
    durationMinutes: 185,
    taxes: 112,
    carrierFees: 48,
    services: [
      { ...FJ, flightNumber: 410, departHour: 12, cabin: "economy", baseFare: 335, seatsAvailable: 28 },
    ],
  },
  {
    origin: "AKL",
    destination: "RAR",
    durationMinutes: 240,
    taxes: 98,
    carrierFees: 42,
    services: [
      { ...NZ, flightNumber: 44, departHour: 14, cabin: "economy", baseFare: 412, seatsAvailable: 15 },
    ],
  },

  // ---- Asia. Pass-through is a third of a cheap ticket. ----
  {
    origin: "AKL",
    destination: "SIN",
    durationMinutes: 620,
    taxes: 169,
    carrierFees: 63,
    services: [
      { ...SQ, flightNumber: 282, departHour: 12, cabin: "economy", baseFare: 510, seatsAvailable: 19 },
      { ...SQ, flightNumber: 286, departHour: 23, cabin: "business", baseFare: 1840, seatsAvailable: 3 },
    ],
  },
  {
    origin: "AKL",
    destination: "HKG",
    durationMinutes: 690,
    taxes: 174,
    carrierFees: 66,
    services: [
      { ...CX, flightNumber: 198, departHour: 22, cabin: "economy", baseFare: 548, seatsAvailable: 25 },
      { ...NZ, flightNumber: 87, departHour: 19, cabin: "premium", baseFare: 965, seatsAvailable: 9 },
    ],
  },
  {
    origin: "AKL",
    destination: "NRT",
    durationMinutes: 655,
    taxes: 158,
    carrierFees: 61,
    services: [
      { ...NZ, flightNumber: 99, departHour: 20, cabin: "economy", baseFare: 573, seatsAvailable: 18 },
    ],
  },
  {
    origin: "SYD",
    destination: "SIN",
    durationMinutes: 480,
    taxes: 146,
    carrierFees: 57,
    services: [
      { ...SQ, flightNumber: 232, departHour: 13, cabin: "economy", baseFare: 449, seatsAvailable: 30 },
    ],
  },

  // ---- Long haul. Pass-through is a large slice of the ticket. ----
  {
    origin: "AKL",
    destination: "LAX",
    durationMinutes: 760,
    taxes: 186,
    carrierFees: 74,
    services: [
      { ...NZ, flightNumber: 2, departHour: 19, cabin: "economy", baseFare: 420, seatsAvailable: 31 },
      { ...NZ, flightNumber: 6, departHour: 21, cabin: "premium", baseFare: 895, seatsAvailable: 8 },
    ],
  },
  {
    origin: "AKL",
    destination: "SFO",
    durationMinutes: 730,
    taxes: 182,
    carrierFees: 72,
    services: [
      { ...NZ, flightNumber: 8, departHour: 20, cabin: "economy", baseFare: 446, seatsAvailable: 22 },
      { ...UA, flightNumber: 916, departHour: 18, cabin: "economy", baseFare: 469, seatsAvailable: 27 },
    ],
  },
  {
    origin: "AKL",
    destination: "YVR",
    durationMinutes: 800,
    taxes: 179,
    carrierFees: 70,
    services: [
      { ...NZ, flightNumber: 22, departHour: 17, cabin: "economy", baseFare: 483, seatsAvailable: 20 },
    ],
  },
  {
    origin: "SYD",
    destination: "LAX",
    durationMinutes: 840,
    taxes: 194,
    carrierFees: 78,
    services: [
      { ...QF, flightNumber: 11, departHour: 10, cabin: "economy", baseFare: 515, seatsAvailable: 26 },
    ],
  },
  {
    origin: "AKL",
    destination: "LHR",
    durationMinutes: 1_500,
    taxes: 310,
    carrierFees: 98,
    services: [
      { ...NZ, flightNumber: 16, departHour: 16, cabin: "economy", baseFare: 1289, seatsAvailable: 12 },
      { ...NZ, flightNumber: 18, departHour: 13, cabin: "business", baseFare: 4120, seatsAvailable: 2 },
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
    taxes: route.taxes,
    carrierFees: route.carrierFees,
    services: route.services.map((service) => ({
      ...service,
      flightNumber: service.flightNumber + 1,
      departHour: (service.departHour + 12) % 24,
    })),
  };
}

/**
 * The booking window: flights run from this many days out, for this many days.
 *
 * The schedule deliberately starts a week ahead rather than tomorrow, which is
 * roughly how far out corporate travel is actually booked. Searching inside the
 * next week returns nothing.
 */
const SCHEDULE_STARTS_IN_DAYS = 8;
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
      { id: "org-kahu", name: "Kahu Logistics", negotiatedDiscountPercent: 12 },
      { id: "org-northwind", name: "Northwind Freight", negotiatedDiscountPercent: 5 },
      { id: "org-harbourline", name: "Harbourline Legal", negotiatedDiscountPercent: 7.5 },
      // No corporate deal. Useful for checking the zero-discount path.
      { id: "org-tuatara", name: "Tuatara Studios", negotiatedDiscountPercent: 0 },
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
  const firstDay = SCHEDULE_STARTS_IN_DAYS;
  const lastDay = SCHEDULE_STARTS_IN_DAYS + DAYS_OF_SCHEDULE - 1;

  for (let day = firstDay; day <= lastDay; day += 1) {
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
          baseFare: service.baseFare,
          taxes: route.taxes,
          carrierFees: route.carrierFees,
          seatsAvailable: service.seatsAvailable,
        });
      }
    }
  }

  db.insert(fares).values(fareRows).run();
}
