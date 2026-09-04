/**
 * Test harness.
 *
 * Every test gets its own in-memory database with a small, fixed dataset —
 * no shared state between tests, and no dependency on the dev seed.
 */

import {
  applySchema,
  createDb,
  fares,
  organisations,
  promotions,
  travellers,
  type Db,
} from "@farepath/db";

/** Fixed so assertions can name exact amounts. */
export const FIXED_NOW = new Date("2026-03-01T09:00:00.000Z");

export const IDS = {
  /** 12% negotiated corporate rate. */
  orgKahu: "org-kahu",
  /** No corporate deal. */
  orgTuatara: "org-tuatara",
  travellerWithDeal: "trv-mereana",
  travellerNoDeal: "trv-sam",
  /** Long haul: base 420, taxes 186, fees 74, gross 680. */
  longHaulFare: "fare-longhaul",
  /** Domestic: base 89, taxes 11, fees 9, gross 109. */
  domesticFare: "fare-domestic",
  /** Long haul with exactly one seat left. */
  lastSeatFare: "fare-lastseat",
} as const;

export function makeTestDb(): Db {
  const db = createDb(":memory:");
  applySchema(db);

  db.insert(organisations)
    .values([
      { id: IDS.orgKahu, name: "Kahu Logistics", negotiatedDiscountPercent: 12 },
      { id: IDS.orgTuatara, name: "Tuatara Studios", negotiatedDiscountPercent: 0 },
    ])
    .run();

  db.insert(travellers)
    .values([
      {
        id: IDS.travellerWithDeal,
        name: "Mereana Walker",
        email: "mereana.walker@kahulogistics.example",
        organisationId: IDS.orgKahu,
      },
      {
        id: IDS.travellerNoDeal,
        name: "Sam Whitcombe",
        email: "sam@tuatarastudios.example",
        organisationId: IDS.orgTuatara,
      },
    ])
    .run();

  db.insert(fares)
    .values([
      {
        id: IDS.longHaulFare,
        carrierCode: "NZ",
        carrierName: "Air New Zealand",
        flightNumber: "NZ2",
        origin: "AKL",
        destination: "LAX",
        departAt: "2026-03-10T19:00:00.000Z",
        arriveAt: "2026-03-11T07:40:00.000Z",
        cabin: "economy",
        currency: "NZD",
        baseFare: 420,
        taxes: 186,
        carrierFees: 74,
        seatsAvailable: 31,
      },
      {
        id: IDS.domesticFare,
        carrierCode: "NZ",
        carrierName: "Air New Zealand",
        flightNumber: "NZ431",
        origin: "AKL",
        destination: "WLG",
        departAt: "2026-03-10T06:00:00.000Z",
        arriveAt: "2026-03-10T07:05:00.000Z",
        cabin: "economy",
        currency: "NZD",
        baseFare: 89,
        taxes: 11,
        carrierFees: 9,
        seatsAvailable: 40,
      },
      {
        id: IDS.lastSeatFare,
        carrierCode: "SQ",
        carrierName: "Singapore Airlines",
        flightNumber: "SQ286",
        origin: "AKL",
        destination: "SIN",
        departAt: "2026-03-10T23:00:00.000Z",
        arriveAt: "2026-03-11T09:15:00.000Z",
        cabin: "business",
        currency: "NZD",
        baseFare: 1840,
        taxes: 248,
        carrierFees: 112,
        seatsAvailable: 1,
      },
    ])
    .run();

  db.insert(promotions)
    .values([
      { code: "KIWI20", kind: "percentage", value: 20, currency: null, active: 1 },
      { code: "WINTER50", kind: "fixed", value: 50, currency: "NZD", active: 1 },
      { code: "EXPIRED99", kind: "percentage", value: 99, currency: null, active: 0 },
    ])
    .run();

  return db;
}
