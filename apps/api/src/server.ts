/**
 * HTTP surface.
 *
 * `buildServer` takes an already-open database so tests can hand it an
 * in-memory one. Nothing in here reaches for a global connection.
 */

import { organisations, travellers, type Db } from "@farepath/db";
import cors from "@fastify/cors";
import { eq } from "drizzle-orm";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";

import {
  confirmBooking,
  findBookingByReference,
  listBookings,
} from "./domain/booking.js";
import { createQuote, findQuote, searchFares } from "./domain/quoting.js";
import { DomainError, ValidationError } from "./errors.js";
import { toBookingView, toFareView, toQuoteView, toTravellerView } from "./mappers.js";

const fareSearchSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  cabin: z.enum(["economy", "premium", "business"]).optional(),
});

const createQuoteSchema = z.object({
  fareId: z.string().min(1),
  travellerId: z.string().min(1),
});

const confirmBookingSchema = z.object({
  quoteId: z.string().min(1),
});

export interface BuildServerOptions {
  db: Db;
  logger?: boolean;
}

export function buildServer({ db, logger = false }: BuildServerOptions): FastifyInstance {
  const app = Fastify({ logger });

  app.register(cors, { origin: true });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof DomainError) {
      return reply
        .status(error.status)
        .send({ error: { code: error.code, message: error.message } });
    }
    app.log.error(error);
    return reply
      .status(500)
      .send({ error: { code: "internal_error", message: "something went wrong" } });
  });

  app.get("/api/health", async () => ({ status: "ok" }));

  app.get("/api/travellers", async () => {
    const rows = db
      .select()
      .from(travellers)
      .innerJoin(organisations, eq(travellers.organisationId, organisations.id))
      .all();

    return rows.map((row) => toTravellerView(row.travellers, row.organisations));
  });

  app.get("/api/fares", async (request) => {
    const parsed = fareSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((i) => i.message).join("; "));
    }

    return searchFares(db, parsed.data).map(toFareView);
  });

  app.post("/api/quotes", async (request, reply) => {
    const parsed = createQuoteSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const result = await createQuote(db, parsed.data);
    return reply
      .status(201)
      .send(
        toQuoteView(result.quote, result.fare, result.traveller, result.organisation),
      );
  });

  app.get<{ Params: { id: string } }>("/api/quotes/:id", async (request) => {
    const result = await findQuote(db, request.params.id);
    return toQuoteView(result.quote, result.fare, result.traveller, result.organisation);
  });

  app.post("/api/bookings", async (request, reply) => {
    const parsed = confirmBookingSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const result = await confirmBooking(db, parsed.data);
    return reply
      .status(201)
      .send(toBookingView(result.booking, result.fare, result.travellerName));
  });

  app.get("/api/bookings", async () =>
    listBookings(db).map((r) => toBookingView(r.booking, r.fare, r.travellerName)),
  );

  app.get<{ Params: { reference: string } }>(
    "/api/bookings/:reference",
    async (request) => {
      const r = findBookingByReference(db, request.params.reference);
      return toBookingView(r.booking, r.fare, r.travellerName);
    },
  );

  return app;
}
