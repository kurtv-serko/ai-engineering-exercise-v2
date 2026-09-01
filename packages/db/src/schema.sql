-- Physical schema for farepath.
--
-- Applied in full by `pnpm db:reset`, which drops and recreates the database.
-- There is no migration tool: the database is disposable dev data, and the
-- seed is the source of truth. Keep this file in step with `schema.ts`.

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS quotes;
DROP TABLE IF EXISTS fares;
DROP TABLE IF EXISTS travellers;
DROP TABLE IF EXISTS organisations;

CREATE TABLE organisations (
  id                      TEXT PRIMARY KEY,
  name                    TEXT    NOT NULL,
  negotiated_discount_bps INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE travellers (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  organisation_id TEXT NOT NULL REFERENCES organisations (id)
);

CREATE TABLE fares (
  id                 TEXT PRIMARY KEY,
  carrier_code       TEXT    NOT NULL,
  carrier_name       TEXT    NOT NULL,
  flight_number      TEXT    NOT NULL,
  origin             TEXT    NOT NULL,
  destination        TEXT    NOT NULL,
  depart_at          TEXT    NOT NULL,
  arrive_at          TEXT    NOT NULL,
  cabin              TEXT    NOT NULL CHECK (cabin IN ('economy', 'premium', 'business')),
  currency           TEXT    NOT NULL,
  base_fare_minor    INTEGER NOT NULL,
  taxes_minor        INTEGER NOT NULL,
  carrier_fees_minor INTEGER NOT NULL,
  seats_available    INTEGER NOT NULL
);

CREATE INDEX fares_route_idx ON fares (origin, destination, depart_at);

CREATE TABLE quotes (
  id                         TEXT PRIMARY KEY,
  fare_id                    TEXT    NOT NULL REFERENCES fares (id),
  traveller_id               TEXT    NOT NULL REFERENCES travellers (id),
  currency                   TEXT    NOT NULL,
  base_fare_minor            INTEGER NOT NULL,
  taxes_minor                INTEGER NOT NULL,
  carrier_fees_minor         INTEGER NOT NULL,
  negotiated_reduction_minor INTEGER NOT NULL DEFAULT 0,
  payable_minor              INTEGER NOT NULL,
  created_at                 TEXT    NOT NULL,
  expires_at                 TEXT    NOT NULL
);

CREATE TABLE bookings (
  id            TEXT PRIMARY KEY,
  reference     TEXT    NOT NULL UNIQUE,
  quote_id      TEXT    NOT NULL REFERENCES quotes (id),
  status        TEXT    NOT NULL CHECK (status IN ('confirmed')),
  currency      TEXT    NOT NULL,
  payable_minor INTEGER NOT NULL,
  confirmed_at  TEXT    NOT NULL
);
