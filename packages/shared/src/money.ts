/**
 * Money primitives.
 *
 * Every amount in this service is an integer count of minor units (cents,
 * pence). Floats are banned throughout the pricing path: once rounding drift
 * reaches the ledger it cannot be reconciled against the card settlement file.
 *
 * Concretely, that means no `/`, no `*` by a fractional factor, and no
 * `Number.prototype.toFixed` on an amount. Use the helpers below, which stay in
 * integer arithmetic from end to end.
 */

export type CurrencyCode = "NZD" | "AUD" | "USD" | "GBP";

export class CurrencyMismatchError extends Error {
  constructor(left: CurrencyCode, right: CurrencyCode) {
    super(`cannot combine amounts in ${left} and ${right}`);
    this.name = "CurrencyMismatchError";
  }
}

/**
 * Return `basisPoints` hundredths of a percent of `amountMinor`.
 *
 * Rounds half up and stays in integer arithmetic throughout. 250 basis points
 * is 2.5%.
 */
export function percentageOf(amountMinor: number, basisPoints: number): number {
  if (!Number.isInteger(amountMinor)) {
    throw new TypeError("amountMinor must be an integer count of minor units");
  }
  if (!Number.isInteger(basisPoints)) {
    throw new TypeError("basisPoints must be an integer");
  }
  if (basisPoints < 0) {
    throw new RangeError("basisPoints must not be negative");
  }
  return Math.floor((amountMinor * basisPoints + 5_000) / 10_000);
}

/** A payable amount is never negative. */
export function clampToZero(amountMinor: number): number {
  return Math.max(amountMinor, 0);
}

/** Display only. Never feed the result of this back into a calculation. */
export function formatMoney(amountMinor: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}
