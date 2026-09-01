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
  /** Long haul: base 42000, taxes 18600, fees 7400, gross 68000. */
  longHaulFare: "fare-longhaul",
  /** Domestic: base 8900, taxes 1100, fees 900, gross 10900. */
  domesticFare: "fare-domestic",
  /** Long haul with exactly one seat left. */
  lastSeatFare: "fare-lastseat",
} as const;

export function makeTestDb(): Db {
  const db = createDb(":memory:");
  applySchema(db);

  db.insert(organisations)
    .values([
      { id: IDS.orgKahu, name: "Kahu Logistics", negotiatedDiscountBps: 1_200 },
      { id: IDS.orgTuatara, name: "Tuatara Studios", negotiatedDiscountBps: 0 },
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
        baseFareMinor: 42_000,
        taxesMinor: 18_600,
        carrierFeesMinor: 7_400,
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
        baseFareMinor: 8_900,
        taxesMinor: 1_100,
        carrierFeesMinor: 900,
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
        baseFareMinor: 184_000,
        taxesMinor: 24_800,
        carrierFeesMinor: 11_200,
        seatsAvailable: 1,
      },
    ])
    .run();

  return db;
}
