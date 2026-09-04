/**
 * Promotion discount calculation.
 *
 * Promotions come in two flavours — a percentage off, or a fixed amount off —
 * so the calculation is modelled as a strategy per flavour behind a common
 * interface. New promotion types can then be added by writing one more
 * strategy and registering it in the factory, without touching the call site.
 */

import { percentOf } from "@farepath/shared";

import type { Promotion } from "./catalogue.js";

/** The priced parts of a quote a discount strategy needs to see. */
export interface QuoteAmounts {
  baseFare: number;
  taxes: number;
  carrierFees: number;
  negotiatedReduction: number;
}

/** The amount a promotion takes off. */
export abstract class DiscountStrategy {
  protected readonly promotion: Promotion;

  constructor(promotion: Promotion) {
    this.promotion = promotion;
  }

  abstract calculate(quote: QuoteAmounts): number;

  /** The amount the promotion is applied to. */
  protected total(quote: QuoteAmounts): number {
    return quote.baseFare + quote.taxes + quote.carrierFees;
  }
}

export class PercentageDiscountStrategy extends DiscountStrategy {
  override calculate(quote: QuoteAmounts): number {
    const total = this.total(quote);
    const discount = percentOf(total, this.promotion.value);

    // Never discount more than the quote is worth.
    return Math.min(discount, total);
  }
}

export class FixedDiscountStrategy extends DiscountStrategy {
  override calculate(quote: QuoteAmounts): number {
    return this.promotion.value;
  }
}

export function discountStrategyFor(promotion: Promotion): DiscountStrategy {
  switch (promotion.kind) {
    case "percentage":
      return new PercentageDiscountStrategy(promotion);
    case "fixed":
      return new FixedDiscountStrategy(promotion);
  }
}

/** The reduction a promotion produces against a quote. */
export function calculatePromotionDiscount(
  promotion: Promotion,
  quote: QuoteAmounts,
): number {
  return discountStrategyFor(promotion).calculate(quote);
}
