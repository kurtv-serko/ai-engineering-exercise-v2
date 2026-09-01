import { useState } from "react";

import type {
  BookingView,
  FareSearchQuery,
  FareView,
  QuoteView,
  TravellerView,
} from "@farepath/shared";

import { createQuote, searchFares } from "../api/client.js";
import { describeError } from "../hooks/useAsync.js";
import { StatusMessage } from "../components/StatusMessage.js";
import { ConfirmationPage } from "./ConfirmationPage.js";
import { FareResults } from "./FareResults.js";
import { QuotePage } from "./QuotePage.js";
import { SearchForm, type SearchFormValues } from "./SearchForm.js";

type Step =
  | { name: "search" }
  | { name: "searching" }
  | { name: "results"; query: FareSearchQuery; travellerId: string; fares: FareView[] }
  | {
      name: "quoting";
      query: FareSearchQuery;
      travellerId: string;
      fares: FareView[];
    }
  | {
      name: "quote";
      quote: QuoteView;
      query: FareSearchQuery;
      travellerId: string;
      fares: FareView[];
    }
  | { name: "confirmed"; booking: BookingView };

interface BookingFlowProps {
  travellers: TravellerView[];
  onViewBookings: () => void;
}

export function BookingFlow({ travellers, onViewBookings }: BookingFlowProps) {
  const [step, setStep] = useState<Step>({ name: "search" });
  const [error, setError] = useState<string | null>(null);

  async function handleSearch({ travellerId, query }: SearchFormValues) {
    setError(null);
    setStep({ name: "searching" });
    try {
      const fares = await searchFares(query);
      setStep({ name: "results", query, travellerId, fares });
    } catch (err) {
      setError(describeError(err));
      setStep({ name: "search" });
    }
  }

  async function handleSelectFare(fare: FareView) {
    if (step.name !== "results") return;
    const { query, travellerId, fares } = step;
    setError(null);
    setStep({ name: "quoting", query, travellerId, fares });
    try {
      const quote = await createQuote({ fareId: fare.id, travellerId });
      setStep({ name: "quote", quote, query, travellerId, fares });
    } catch (err) {
      setError(describeError(err));
      setStep({ name: "results", query, travellerId, fares });
    }
  }

  function handleBackToSearch() {
    setError(null);
    setStep({ name: "search" });
  }

  function handleBackToResults() {
    if (step.name !== "quote" && step.name !== "quoting") return;
    const { query, travellerId, fares } = step;
    setError(null);
    setStep({ name: "results", query, travellerId, fares });
  }

  switch (step.name) {
    case "search":
      return (
        <section>
          <h2>Search flights</h2>
          {error && <StatusMessage kind="error" message={error} />}
          <SearchForm travellers={travellers} onSubmit={handleSearch} />
        </section>
      );

    case "searching":
    case "quoting":
      return <StatusMessage kind="loading" />;

    case "results":
      return (
        <>
          {error && <StatusMessage kind="error" message={error} />}
          <FareResults
            query={step.query}
            fares={step.fares}
            onSelect={handleSelectFare}
            onBack={handleBackToSearch}
          />
        </>
      );

    case "quote":
      return (
        <QuotePage
          quote={step.quote}
          onConfirmed={(booking) => setStep({ name: "confirmed", booking })}
          onBack={handleBackToResults}
        />
      );

    case "confirmed":
      return (
        <ConfirmationPage
          booking={step.booking}
          onNewSearch={handleBackToSearch}
          onViewBookings={onViewBookings}
        />
      );
  }
}
