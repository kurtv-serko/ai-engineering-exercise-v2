/**
 * Priced itineraries for tests.
 *
 * Pick the shape that matches what you are actually asserting. Most money
 * rules only bite when there is a pass-through component to get wrong, so
 * `longHaul()` is the right default for anything touching discounts, refunds
 * or totals.
 */

import type { PricedItinerary } from "../../src/domain/pricing/rules.js";

/**
 * A realistic long haul fare. Taxes and carrier fees are 38% of the ticket.
 *
 * This is the default fixture for money rules: because the pass-through
 * component is large, a rule that reduces the wrong basis produces a visibly
 * wrong number rather than an off-by-a-few-cents one.
 */
export function longHaul(): PricedItinerary {
  return {
    baseFareMinor: 42_000,
    taxesMinor: 18_600,
    carrierFeesMinor: 7_400,
  };
}

/** A domestic hop. Small base fare, small pass-through. */
export function domestic(): PricedItinerary {
  return {
    baseFareMinor: 8_900,
    taxesMinor: 1_100,
    carrierFeesMinor: 900,
  };
}

/**
 * An itinerary with no taxes and no carrier fees.
 *
 * Use this ONLY to check arithmetic in isolation — rounding, clamping, the
 * shape of a return value. Never use it to test a rule about *which* amount is
 * being reduced: with no pass-through component, discounting the base fare and
 * discounting the gross total give the same answer, so the fixture agrees with
 * a correct implementation and a broken one alike.
 */
export function taxFree(): PricedItinerary {
  return {
    baseFareMinor: 20_000,
    taxesMinor: 0,
    carrierFeesMinor: 0,
  };
}
