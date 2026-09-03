/**
 * Money primitives.
 *
 * Every amount in this service is a decimal number of dollars (or the
 * equivalent major unit for the currency): `420` is four hundred and twenty
 * dollars, not cents. That means ordinary float arithmetic, and float
 * arithmetic drifts — `420 * 0.12` is `50.400000000000006`, not `50.4`.
 *
 * The fix is not to avoid floats, it is to never let the drift accumulate:
 * every computed amount is rounded to the nearest cent immediately, with
 * `roundMoney()`, before it is stored, compared, or used in a further
 * calculation. As long as every arithmetic step rounds its own result, drift
 * never has anywhere to build up. Use the helpers below rather than doing the
 * rounding by hand.
 */

export type CurrencyCode = "NZD" | "AUD" | "USD" | "GBP";

export class CurrencyMismatchError extends Error {
  constructor(left: CurrencyCode, right: CurrencyCode) {
    super(`cannot combine amounts in ${left} and ${right}`);
    this.name = "CurrencyMismatchError";
  }
}

/** Round an amount to the nearest cent. Call this after every arithmetic step. */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * `percent` percent of `amount`, rounded to the nearest cent.
 *
 * 12 is 12%. The result is rounded immediately, so it is safe to feed into a
 * further calculation without drift accumulating.
 */
export function percentOf(amount: number, percent: number): number {
  return roundMoney((amount * percent) / 100);
}

/** A payable amount is never negative. */
export function clampToZero(amount: number): number {
  return Math.max(amount, 0);
}

/** Display only. Never feed the result of this back into a calculation. */
export function formatMoney(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency,
  }).format(amount);
}
