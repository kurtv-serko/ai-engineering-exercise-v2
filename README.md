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

The network is 17 airports and 42 routes: 21 city pairs, each seeded in both
directions, flown by seven carriers in a mix of cabins.

**The booking window opens a week out and runs for 21 days**, which is roughly
the lead time corporate travel is booked at. Searching inside the next seven
days finds nothing, so the search form defaults to ten days ahead.

`GET /api/network` returns only the routes that actually have fares, and the
search form uses it to populate its dropdowns — so you cannot pick a city pair
that does not exist.

New Zealand domestic, trans-Tasman, Australian domestic, Pacific, Asia and long
haul are all represented, and the **pass-through share deliberately varies by
route**: on AKL→WLG, taxes and carrier fees are 20.00 of a 109.00 ticket; on
AKL→LAX they are 260.00 of 680.00. That spread is why it matters which amount a
discount is applied to.

Six travellers across four organisations, with different corporate rates:

| Traveller        | Organisation      | Negotiated rate |
| ---------------- | ----------------- | --------------- |
| Mereana Walker   | Kahu Logistics    | 12%             |
| Daniel Okafor    | Kahu Logistics    | 12%             |
| Priya Raman      | Northwind Freight | 5%              |
| Tomás Ferreira   | Northwind Freight | 5%              |
| Aroha Ngata      | Harbourline Legal | 7.5%            |
| Sam Whitcombe    | Tuatara Studios   | none            |

Routes are defined once in `packages/db/src/seed.ts` and mirrored automatically
for the return leg: the flight number gains one and the departure moves twelve
hours, as a real aircraft rotation would.
