import { useMemo, useState, type FormEvent } from "react";

import type {
  Cabin,
  FareSearchQuery,
  NetworkView,
  TravellerView,
} from "@farepath/shared";

/**
 * Far enough out that the seeded schedule always has departures.
 *
 * The schedule starts eight days ahead, so anything sooner than that finds
 * nothing.
 */
function defaultDepartureDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 10);
  return date.toISOString().slice(0, 10);
}

const CABINS: Cabin[] = ["economy", "premium", "business"];

function titleCase(value: string): string {
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

export interface SearchFormValues {
  travellerId: string;
  query: FareSearchQuery;
}

interface SearchFormProps {
  travellers: TravellerView[];
  network: NetworkView;
  onSubmit: (values: SearchFormValues) => void;
}

export function SearchForm({ travellers, network, onSubmit }: SearchFormProps) {
  const [travellerId, setTravellerId] = useState(travellers[0]?.id ?? "");
  const [date, setDate] = useState(defaultDepartureDate);
  const [cabin, setCabin] = useState<Cabin | "">("");

  const label = useMemo(() => {
    const byCode = new Map(network.airports.map((a) => [a.code, a]));
    return (code: string) => {
      const airport = byCode.get(code);
      return airport ? `${airport.city} (${airport.code})` : code;
    };
  }, [network.airports]);

  /** Only offer destinations actually served from the chosen origin. */
  const destinationsByOrigin = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const route of network.routes) {
      const existing = map.get(route.origin);
      if (existing) {
        existing.push(route.destination);
      } else {
        map.set(route.origin, [route.destination]);
      }
    }
    return map;
  }, [network.routes]);

  const origins = useMemo(
    () => [...destinationsByOrigin.keys()].sort((a, b) => label(a).localeCompare(label(b))),
    [destinationsByOrigin, label],
  );

  const [origin, setOrigin] = useState(origins.includes("AKL") ? "AKL" : (origins[0] ?? ""));

  const destinations = useMemo(() => {
    const options = destinationsByOrigin.get(origin) ?? [];
    return [...options].sort((a, b) => label(a).localeCompare(label(b)));
  }, [destinationsByOrigin, origin, label]);

  const [destination, setDestination] = useState("LAX");

  // Changing origin can strand the chosen destination on a route that does not
  // exist, so fall back to the first one that does.
  const effectiveDestination = destinations.includes(destination)
    ? destination
    : (destinations[0] ?? "");

  function handleOriginChange(next: string) {
    setOrigin(next);
    const served = destinationsByOrigin.get(next) ?? [];
    if (!served.includes(destination)) {
      setDestination(served[0] ?? "");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      travellerId,
      query: {
        origin,
        destination: effectiveDestination,
        date,
        ...(cabin ? { cabin } : {}),
      },
    });
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="traveller">Traveller</label>
        <select
          id="traveller"
          value={travellerId}
          onChange={(e) => setTravellerId(e.target.value)}
          required
        >
          {travellers.map((traveller) => (
            <option key={traveller.id} value={traveller.id}>
              {traveller.name} — {traveller.organisation.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="origin">From</label>
          <select
            id="origin"
            value={origin}
            onChange={(e) => handleOriginChange(e.target.value)}
            required
          >
            {origins.map((code) => (
              <option key={code} value={code}>
                {label(code)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="destination">To</label>
          <select
            id="destination"
            value={effectiveDestination}
            onChange={(e) => setDestination(e.target.value)}
            required
          >
            {destinations.map((code) => (
              <option key={code} value={code}>
                {label(code)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="date">Departure date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="cabin">Cabin</label>
          <select
            id="cabin"
            value={cabin}
            onChange={(e) => setCabin(e.target.value as Cabin | "")}
          >
            <option value="">Any</option>
            {CABINS.map((c) => (
              <option key={c} value={c}>
                {titleCase(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" className="button button--primary">
        Search fares
      </button>
    </form>
  );
}
