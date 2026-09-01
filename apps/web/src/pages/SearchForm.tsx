import { useState, type FormEvent } from "react";

import type { Cabin, FareSearchQuery, TravellerView } from "@farepath/shared";

function defaultDepartureDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

const CABINS: Cabin[] = ["economy", "premium", "business"];

export interface SearchFormValues {
  travellerId: string;
  query: FareSearchQuery;
}

interface SearchFormProps {
  travellers: TravellerView[];
  onSubmit: (values: SearchFormValues) => void;
}

export function SearchForm({ travellers, onSubmit }: SearchFormProps) {
  const [travellerId, setTravellerId] = useState(travellers[0]?.id ?? "");
  const [origin, setOrigin] = useState("AKL");
  const [destination, setDestination] = useState("LAX");
  const [date, setDate] = useState(defaultDepartureDate);
  const [cabin, setCabin] = useState<Cabin | "">("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      travellerId,
      query: {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
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
          <label htmlFor="origin">Origin</label>
          <input
            id="origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            maxLength={3}
            minLength={3}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="destination">Destination</label>
          <input
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            maxLength={3}
            minLength={3}
            required
          />
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
          <select id="cabin" value={cabin} onChange={(e) => setCabin(e.target.value as Cabin | "")}>
            <option value="">Any</option>
            {CABINS.map((c) => (
              <option key={c} value={c}>
                {c[0]?.toUpperCase()}
                {c.slice(1)}
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
