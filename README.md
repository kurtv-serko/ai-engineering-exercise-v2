# farepath

A small corporate travel booking service. Travellers search fares, we price a
quote, and they confirm a booking.

Prices are built from three components — base fare, taxes and carrier fees —
and organisations get a negotiated corporate rate. Getting the interaction
between those two things right is most of what this service does.

## Running it

You need Node 20 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

That is the whole setup. The API seeds a fresh SQLite database on first boot,
so there is no migration step and no service to install.

- web: http://localhost:5173
- api: http://localhost:3001

```bash
pnpm test        # vitest, the whole workspace
pnpm typecheck   # tsc --build across every package
pnpm build       # production build of api and web
pnpm db:reset    # wipe and reseed; destroys any bookings you made
```

## Layout

```
apps/
  api/        Fastify HTTP API
    src/domain/pricing/rules.ts   pricing invariants — read this before
                                  changing anything that moves money
    src/domain/quoting.ts         fare search and quote creation
    src/domain/booking.ts         booking confirmation
    test/                         vitest, incl. fixtures in test/support
  web/        React + Vite client
packages/
  shared/     wire contracts and money primitives shared by api and web
  db/         Drizzle schema, physical schema.sql, and the dev seed
```

## Things worth knowing

**Money is always integer minor units.** Cents, never dollars; `4299`, never
`42.99`. Floats are banned in the pricing path — see the note at the top of
`packages/shared/src/money.ts`. Use the helpers there rather than doing
arithmetic by hand.

**The pricing invariants are documented, not implied.**
`apps/api/src/domain/pricing/rules.ts` states what may be reduced and by how
much, and exports the helpers that enforce it. If you are writing code that
changes a price, that file is the specification.

**The database is disposable.** There is no migration tool. `schema.sql` is
applied wholesale by `pnpm db:reset`, and the seed is the source of truth. If
you add a column, add it to both `schema.sql` and `schema.ts`.

**Quotes expire.** A quote is honoured for 30 minutes, and confirming pays the
amount recorded on the quote rather than re-pricing the fare.

## Seeded data

Flights run for the next 14 days on AKL→SYD, AKL→LAX, AKL→SIN, AKL→WLG and
SYD→AKL, in a mix of cabins.

Four travellers across three organisations, with different corporate rates:

| Traveller       | Organisation      | Negotiated rate |
| --------------- | ----------------- | --------------- |
| Mereana Walker  | Kahu Logistics    | 12%             |
| Daniel Okafor   | Kahu Logistics    | 12%             |
| Priya Raman     | Northwind Freight | 5%              |
| Sam Whitcombe   | Tuatara Studios   | none            |
