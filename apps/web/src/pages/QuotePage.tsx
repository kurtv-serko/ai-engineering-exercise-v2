import { useState } from "react";

import { formatMoney } from "@farepath/shared";
import type { BookingView, QuoteView } from "@farepath/shared";

import { confirmBooking } from "../api/client.js";
import { describeError } from "../hooks/useAsync.js";
import { formatPercent, formatDateTime } from "../format.js";
import { StatusMessage } from "../components/StatusMessage.js";

interface QuotePageProps {
  quote: QuoteView;
  onConfirmed: (booking: BookingView) => void;
  onBack: () => void;
}

export function QuotePage({ quote, onConfirmed, onBack }: QuotePageProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      const booking = await confirmBooking({ quoteId: quote.id });
      onConfirmed(booking);
    } catch (err) {
      setError(describeError(err));
      setConfirming(false);
    }
  }

  const { fare, currency } = quote;
  const { organisation } = quote.traveller;
  const hasCorporateRate = quote.negotiatedReduction > 0;
  // The corporate rate comes off the base fare, so the running total the
  // traveller sees is the discounted base plus the untouched pass-through.
  const discountedBase = quote.baseFare - quote.negotiatedReduction;

  return (
    <section>
      <div className="page-header">
        <h2>Quote for {fare.carrierName} {fare.flightNumber}</h2>
        <button type="button" className="button button--link" onClick={onBack}>
          Back to results
        </button>
      </div>

      <p className="quote-summary">
        {fare.origin} → {fare.destination} · {formatDateTime(fare.departAt)} ·{" "}
        {quote.traveller.name}
      </p>

      <p className="quote-gross">
        Fare total before any discount{" "}
        <strong>{formatMoney(quote.total, currency)}</strong>
      </p>

      <table className="price-table">
        <tbody>
          <tr>
            <th scope="row">Base fare</th>
            <td>{formatMoney(quote.baseFare, currency)}</td>
          </tr>
          {hasCorporateRate && (
            <>
              <tr className="price-table__reduction">
                <th scope="row">
                  {organisation.name} corporate rate{" "}
                  {formatPercent(organisation.negotiatedDiscountPercent)}
                  <span className="price-table__note">applies to the base fare only</span>
                </th>
                <td>−{formatMoney(quote.negotiatedReduction, currency)}</td>
              </tr>
              <tr className="price-table__subtotal">
                <th scope="row">Base fare after corporate rate</th>
                <td>{formatMoney(discountedBase, currency)}</td>
              </tr>
            </>
          )}
          <tr>
            <th scope="row">
              Taxes
              <span className="price-table__note">passed through in full</span>
            </th>
            <td>{formatMoney(quote.taxes, currency)}</td>
          </tr>
          <tr>
            <th scope="row">
              Carrier fees
              <span className="price-table__note">passed through in full</span>
            </th>
            <td>{formatMoney(quote.carrierFees, currency)}</td>
          </tr>
          <tr className="price-table__payable">
            <th scope="row">Payable total</th>
            <td>{formatMoney(quote.payable, currency)}</td>
          </tr>
        </tbody>
      </table>

      <p className="quote-expiry">Quote expires at {formatDateTime(quote.expiresAt)}.</p>

      {error && <StatusMessage kind="error" message={error} />}

      <button
        type="button"
        className="button button--primary"
        onClick={handleConfirm}
        disabled={confirming}
      >
        {confirming ? "Confirming…" : "Confirm booking"}
      </button>
    </section>
  );
}
