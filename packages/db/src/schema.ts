/**
 * Database schema.
 *
 * Money columns are integer minor units. SQLite has no decimal type and we do
 * not want one — see the note on floats in `@farepath/shared/money`.
 *
 * The physical tables are created by `schema.sql`, which is applied on every
 * `pnpm db:reset`. If you add a column here, add it there too.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const organisations = sqliteTable("organisations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  negotiatedDiscountBps: integer("negotiated_discount_bps").notNull().default(0),
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
  baseFareMinor: integer("base_fare_minor").notNull(),
  taxesMinor: integer("taxes_minor").notNull(),
  carrierFeesMinor: integer("carrier_fees_minor").notNull(),
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
  baseFareMinor: integer("base_fare_minor").notNull(),
  taxesMinor: integer("taxes_minor").notNull(),
  carrierFeesMinor: integer("carrier_fees_minor").notNull(),
  negotiatedReductionMinor: integer("negotiated_reduction_minor").notNull().default(0),
  payableMinor: integer("payable_minor").notNull(),
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
  payableMinor: integer("payable_minor").notNull(),
  confirmedAt: text("confirmed_at").notNull(),
});

export type OrganisationRow = typeof organisations.$inferSelect;
export type TravellerRow = typeof travellers.$inferSelect;
export type FareRow = typeof fares.$inferSelect;
export type QuoteRow = typeof quotes.$inferSelect;
export type BookingRow = typeof bookings.$inferSelect;
