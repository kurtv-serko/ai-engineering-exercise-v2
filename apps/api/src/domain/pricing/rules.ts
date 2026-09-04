/**
 * Fare pricing rules.
 *
 * This file is the single source of truth for what may and may not be reduced
 * on a quote. If you are changing anything that moves money, read it first.
 *
 * Invariant D1 (discount basis)
 * -----------------------------
 * A discount reduces the base fare and nothing else. Taxes and carrier fees are
 * statutory pass-through amounts that we collect on behalf of a third party and
 * remit in full. Discounting them means remitting money we never collected,
 * which the monthly settlement reconciliation will reject.
 *
 * Any reduction computed against a quote's gross total is therefore a defect,
 * not a rounding difference. Use `discountableBasis()` to obtain the correct
 * basis, and `applyReduction()` to apply it.
 *
 * Invariant D2 (floor)
 * --------------------
 * A discount never takes the payable total below the taxes and fees component.
 * `applyReduction()` enforces this by capping the reduction at the discountable
 * basis. Do not re-implement the cap at the call site: two caps in two places
 * is how they drift apart.
 *
 * Invariant D3 (composition)
 * --------------------------
 * Reductions compose against the *remaining* discountable basis, in the order
 * they are applied. The corporate negotiated rate is always applied first,
 * because it is contractual; anything discretionary comes after it and may only
 * reduce what is left.
 *
 * Refunds
 * -------
 * Cancellation refunds are specified in `docs/refund-policy.md`, owned by
 * Finance. Not yet implemented in code.
 */

import { clampToZero, percentOf } from "@farepath/shared";

/** The priced components a rule needs. Deliberately not the whole quote row. */
export interface PricedItinerary {
  baseFare: number;
  taxes: number;
  carrierFees: number;
}

/** Gross of any reduction. */
export function grossTotal(itinerary: PricedItinerary): number {
  return itinerary.baseFare + itinerary.taxes + itinerary.carrierFees;
}

/** The pass-through component, which no discount may touch. See D1. */
export function passThroughTotal(itinerary: PricedItinerary): number {
  return itinerary.taxes + itinerary.carrierFees;
}

/**
 * The only amount a promotion or negotiated rate is permitted to reduce.
 *
 * See invariant D1. `alreadyReduced` lets reductions compose against what is
 * left rather than against the list base fare — see invariant D3.
 */
export function discountableBasis(
  itinerary: PricedItinerary,
  alreadyReduced = 0,
): number {
  return clampToZero(itinerary.baseFare - alreadyReduced);
}

/**
 * Cap a proposed reduction at what is actually discountable.
 *
 * This is the only place the D2 floor is enforced. Call it rather than writing
 * your own `Math.min`.
 */
export function capReduction(
  itinerary: PricedItinerary,
  proposed: number,
  alreadyReduced = 0,
): number {
  return clampToZero(Math.min(proposed, discountableBasis(itinerary, alreadyReduced)));
}

/** Payable total after a reduction, respecting invariants D1 and D2. */
export function applyReduction(
  itinerary: PricedItinerary,
  reduction: number,
  alreadyReduced = 0,
): number {
  const capped = capReduction(itinerary, reduction, alreadyReduced);
  return clampToZero(grossTotal(itinerary) - alreadyReduced - capped);
}

/**
 * The contractual corporate rate for an organisation.
 *
 * Applied first, before anything discretionary. See invariant D3.
 */
export function negotiatedReduction(
  itinerary: PricedItinerary,
  negotiatedDiscountPercent: number,
): number {
  const proposed = percentOf(discountableBasis(itinerary), negotiatedDiscountPercent);
  return capReduction(itinerary, proposed);
}
