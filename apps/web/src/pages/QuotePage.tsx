import { useState, type FormEvent } from "react";

import { formatMoney } from "@farepath/shared";
import type { BookingView, QuoteView } from "@farepath/shared";

import { applyPromotion, confirmBooking } from "../api/client.js";
import { describeError } from "../hooks/useAsync.js";
import { formatPercent, formatDateTime } from "../format.js";
import { StatusMessage } from "../components/StatusMessage.js";

interface QuotePageProps {
  quote: QuoteView;
  onQuoteUpdated: (quote: QuoteView) => void;
  onConfirmed: (booking: BookingView) => void;
  onBack: () => void;
}

export function QuotePage({
  quote,
  onQuoteUpdated,
  onConfirmed,
  onBack,
}: QuotePageProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  async function handleApplyPromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!promoCode.trim()) return;

    setApplyingPromo(true);
    setError(null);
    try {
      const updated = await applyPromotion(quote.id, { code: promoCode });
      onQuoteUpdated(updated);
      setPromoCode("");
    } catch (err) {
      setError(describeError(err));
    } finally {
      setApplyingPromo(false);
    }
  }

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
          {quote.promotionCode && (
            <tr className="price-table__reduction">
              <th scope="row">Promotion {quote.promotionCode}</th>
              <td>−{formatMoney(quote.promotionReduction, currency)}</td>
            </tr>
          )}
          <tr className="price-table__payable">
            <th scope="row">Payable total</th>
            <td>{formatMoney(quote.payable, currency)}</td>
          </tr>
        </tbody>
      </table>

      <form className="promo-form" onSubmit={handleApplyPromotion}>
        <label className="promo-form__label" htmlFor="promo-code">
          Promotion code
        </label>
        <div className="promo-form__row">
          <input
            id="promo-code"
            name="promo-code"
            type="text"
            autoComplete="off"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            placeholder="e.g. KIWI20"
          />
          <button type="submit" className="button" disabled={applyingPromo}>
            {applyingPromo ? "Applying…" : "Apply"}
          </button>
        </div>
        {quote.promotionCode && (
          <p className="promo-form__applied">
            Promotion {quote.promotionCode} applied.
          </p>
        )}
      </form>

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
