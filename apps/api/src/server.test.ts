/** End-to-end over the HTTP surface, using Fastify's inject — no open port. */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Db } from "@farepath/db";
import type { FastifyInstance } from "fastify";

import { buildServer } from "./server.js";
import { IDS, makeTestDb } from "./testing/harness.js";

let db: Db;
let app: FastifyInstance;

beforeEach(async () => {
  db = makeTestDb();
  app = buildServer({ db });
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

describe("GET /api/health", () => {
  it("reports ok", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });
});

describe("GET /api/network", () => {
  it("lists only routes that have fares", async () => {
    const res = await app.inject({ method: "GET", url: "/api/network" });

    expect(res.statusCode).toBe(200);
    expect(res.json().routes).toEqual([
      { origin: "AKL", destination: "LAX" },
      { origin: "AKL", destination: "SIN" },
      { origin: "AKL", destination: "WLG" },
    ]);
  });

  it("lists only airports those routes touch, with their cities", async () => {
    const res = await app.inject({ method: "GET", url: "/api/network" });

    const airports = res.json().airports;
    expect(airports.map((a: { code: string }) => a.code).sort()).toEqual([
      "AKL",
      "LAX",
      "SIN",
      "WLG",
    ]);
    expect(airports.find((a: { code: string }) => a.code === "AKL").city).toBe(
      "Auckland",
    );
  });
});

describe("GET /api/travellers", () => {
  it("includes the organisation and its negotiated rate", async () => {
    const res = await app.inject({ method: "GET", url: "/api/travellers" });

    expect(res.statusCode).toBe(200);
    const withDeal = res
      .json()
      .find((t: { id: string }) => t.id === IDS.travellerWithDeal);
    expect(withDeal.organisation.negotiatedDiscountPercent).toBe(12);
  });
});

describe("GET /api/fares", () => {
  it("returns fares on the route with a gross total", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/fares?origin=AKL&destination=LAX&date=2026-03-10",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
    expect(res.json()[0].total).toBe(680);
  });

  it("rejects a malformed date", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/fares?origin=AKL&destination=LAX&date=10-03-2026",
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("validation_failed");
  });

  it("rejects a missing destination", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/fares?origin=AKL&date=2026-03-10",
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/quotes", () => {
  it("prices a quote with the corporate rate off the base fare", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/quotes",
      payload: { fareId: IDS.longHaulFare, travellerId: IDS.travellerWithDeal },
    });

    expect(res.statusCode).toBe(201);
    const quote = res.json();
    expect(quote.total).toBe(680);
    expect(quote.negotiatedReduction).toBe(50.4);
    expect(quote.payable).toBe(629.6);
  });

  it("404s an unknown fare", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/quotes",
      payload: { fareId: "fare-nope", travellerId: IDS.travellerWithDeal },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("not_found");
  });

  it("400s a missing travellerId", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/quotes",
      payload: { fareId: IDS.longHaulFare },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("booking round trip", () => {
  async function quoteThenBook(travellerId: string, fareId: string = IDS.longHaulFare) {
    const quoteRes = await app.inject({
      method: "POST",
      url: "/api/quotes",
      payload: { fareId, travellerId },
    });
    const quote = quoteRes.json();

    const bookingRes = await app.inject({
      method: "POST",
      url: "/api/bookings",
      payload: { quoteId: quote.id },
    });

    return { quote, bookingRes };
  }

  it("confirms a booking for the quoted amount", async () => {
    const { quote, bookingRes } = await quoteThenBook(IDS.travellerWithDeal);

    expect(bookingRes.statusCode).toBe(201);
    const booking = bookingRes.json();
    expect(booking.payable).toBe(quote.payable);
    expect(booking.travellerName).toBe("Mereana Walker");
    expect(booking.fare.flightNumber).toBe("NZ2");
  });

  it("reads the booking back by reference", async () => {
    const { bookingRes } = await quoteThenBook(IDS.travellerWithDeal);
    const reference = bookingRes.json().reference;

    const res = await app.inject({
      method: "GET",
      url: `/api/bookings/${reference}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().reference).toBe(reference);
  });

  it("404s an unknown reference", async () => {
    const res = await app.inject({ method: "GET", url: "/api/bookings/ZZZZZZ" });
    expect(res.statusCode).toBe(404);
  });

  it("409s a quote that is already booked", async () => {
    const quoteRes = await app.inject({
      method: "POST",
      url: "/api/quotes",
      payload: { fareId: IDS.longHaulFare, travellerId: IDS.travellerWithDeal },
    });
    const quoteId = quoteRes.json().id;

    await app.inject({ method: "POST", url: "/api/bookings", payload: { quoteId } });
    const second = await app.inject({
      method: "POST",
      url: "/api/bookings",
      payload: { quoteId },
    });

    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe("quote_already_booked");
  });

  it("lists confirmed bookings", async () => {
    await quoteThenBook(IDS.travellerWithDeal);
    await quoteThenBook(IDS.travellerNoDeal, IDS.domesticFare);

    const res = await app.inject({ method: "GET", url: "/api/bookings" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(2);
  });
});
