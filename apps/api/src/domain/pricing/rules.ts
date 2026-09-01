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
 * Invariant R1 (refund basis) — NOT YET IMPLEMENTED, ships in FP-241
 * ------------------------------------------------------------------
 * When a confirmed booking is cancelled, the refund is computed as follows.
 *
 *   1. Taxes are refunded in full. We only remit them for a journey that is
 *      actually flown, so an unflown ticket recovers them entirely.
 *   2. Carrier fees are never refunded once a booking is confirmed. The carrier
 *      bills us for them at the point of ticketing and does not give them back.
 *   3. The base fare is refunded at a cabin-dependent rate:
 *        economy   50%
 *        premium   75%
 *        business  100%
 *   4. Cooling-off override: if the cancellation happens within 24 hours of
 *      confirmation, the base fare is refunded in full whatever the cabin.
 *   5. The base fare used in steps 3 and 4 is the base fare *actually paid* —
 *      that is, net of any negotiated reduction already applied to it. We do
 *      not refund a discount the traveller never paid for.
 *   6. A refund never exceeds the amount paid, and is never negative.
 */

import { clampToZero, percentageOf } from "@farepath/shared";

/** The priced components a rule needs. Deliberately not the whole quote row. */
export interface PricedItinerary {
  baseFareMinor: number;
  taxesMinor: number;
  carrierFeesMinor: number;
}

/** Gross of any reduction. */
export function grossTotal(itinerary: PricedItinerary): number {
  return itinerary.baseFareMinor + itinerary.taxesMinor + itinerary.carrierFeesMinor;
}

/** The pass-through component, which no discount may touch. See D1. */
export function passThroughTotal(itinerary: PricedItinerary): number {
  return itinerary.taxesMinor + itinerary.carrierFeesMinor;
}

/**
 * The only amount a promotion or negotiated rate is permitted to reduce.
 *
 * See invariant D1. `alreadyReducedMinor` lets reductions compose against what
 * is left rather than against the list base fare — see invariant D3.
 */
export function discountableBasis(
  itinerary: PricedItinerary,
  alreadyReducedMinor = 0,
): number {
  return clampToZero(itinerary.baseFareMinor - alreadyReducedMinor);
}

/**
 * Cap a proposed reduction at what is actually discountable.
 *
 * This is the only place the D2 floor is enforced. Call it rather than writing
 * your own `Math.min`.
 */
export function capReduction(
  itinerary: PricedItinerary,
  proposedMinor: number,
  alreadyReducedMinor = 0,
): number {
  return clampToZero(
    Math.min(proposedMinor, discountableBasis(itinerary, alreadyReducedMinor)),
  );
}

/** Payable total after a reduction, respecting invariants D1 and D2. */
export function applyReduction(
  itinerary: PricedItinerary,
  reductionMinor: number,
  alreadyReducedMinor = 0,
): number {
  const capped = capReduction(itinerary, reductionMinor, alreadyReducedMinor);
  return clampToZero(grossTotal(itinerary) - alreadyReducedMinor - capped);
}

/**
 * The contractual corporate rate for an organisation, in minor units.
 *
 * Applied first, before anything discretionary. See invariant D3.
 */
export function negotiatedReduction(
  itinerary: PricedItinerary,
  negotiatedDiscountBps: number,
): number {
  const proposed = percentageOf(discountableBasis(itinerary), negotiatedDiscountBps);
  return capReduction(itinerary, proposed);
}
