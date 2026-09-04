/**
 * Database schema.
 *
 * Money columns are decimal dollars, stored as REAL. Every computed amount is
 * rounded to the nearest cent before it is written — see the note at the top
 * of `@farepath/shared/money` — so no column here ever needs more precision
 * than that.
 *
 * The physical tables are created by `schema.sql`, which is applied on every
 * `pnpm db:reset`. If you add a column here, add it there too.
 */

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const organisations = sqliteTable("organisations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  negotiatedDiscountPercent: real("negotiated_discount_percent").notNull().default(0),
});

export const travellers = sqliteTable("travellers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  organisationId: text("organisation_id")
    .notNull()
    .references(() => organisations.id),
});

export const fares = sqliteTable("fares", {
  id: text("id").primaryKey(),
  carrierCode: text("carrier_code").notNull(),
  carrierName: text("carrier_name").notNull(),
  flightNumber: text("flight_number").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departAt: text("depart_at").notNull(),
  arriveAt: text("arrive_at").notNull(),
  cabin: text("cabin").$type<"economy" | "premium" | "business">().notNull(),
  currency: text("currency").$type<"NZD" | "AUD" | "USD" | "GBP">().notNull(),
  baseFare: real("base_fare").notNull(),
  taxes: real("taxes").notNull(),
  carrierFees: real("carrier_fees").notNull(),
  seatsAvailable: integer("seats_available").notNull(),
});

export const quotes = sqliteTable("quotes", {
  id: text("id").primaryKey(),
  fareId: text("fare_id")
    .notNull()
    .references(() => fares.id),
  travellerId: text("traveller_id")
    .notNull()
    .references(() => travellers.id),
  currency: text("currency").$type<"NZD" | "AUD" | "USD" | "GBP">().notNull(),
  baseFare: real("base_fare").notNull(),
  taxes: real("taxes").notNull(),
  carrierFees: real("carrier_fees").notNull(),
  negotiatedReduction: real("negotiated_reduction").notNull().default(0),
  payable: real("payable").notNull(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  quoteId: text("quote_id")
    .notNull()
    .references(() => quotes.id),
  status: text("status").$type<"confirmed">().notNull(),
  currency: text("currency").$type<"NZD" | "AUD" | "USD" | "GBP">().notNull(),
  payable: real("payable").notNull(),
  confirmedAt: text("confirmed_at").notNull(),
});

export type OrganisationRow = typeof organisations.$inferSelect;
export type TravellerRow = typeof travellers.$inferSelect;
export type FareRow = typeof fares.$inferSelect;
export type QuoteRow = typeof quotes.$inferSelect;
export type BookingRow = typeof bookings.$inferSelect;
