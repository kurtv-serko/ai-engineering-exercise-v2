import { describe, expect, it } from "vitest";

import {
  calculatePromotionDiscount,
  discountStrategyFor,
  FixedDiscountStrategy,
  PercentageDiscountStrategy,
  type QuoteAmounts,
} from "./discount.js";

const quote: QuoteAmounts = {
  baseFare: 200,
  taxes: 0,
  carrierFees: 0,
  negotiatedReduction: 0,
};

describe("discountStrategyFor", () => {
  it("returns a percentage strategy for a percentage promotion", () => {
    const strategy = discountStrategyFor({
      code: "KIWI20",
      kind: "percentage",
      value: 20,
      currency: null,
    });

    expect(strategy).toBeInstanceOf(PercentageDiscountStrategy);
  });

  it("returns a fixed strategy for a fixed promotion", () => {
    const strategy = discountStrategyFor({
      code: "WINTER50",
      kind: "fixed",
      value: 50,
      currency: "NZD",
    });

    expect(strategy).toBeInstanceOf(FixedDiscountStrategy);
  });
});

describe("percentage promotions", () => {
  it("takes 20 percent off", () => {
    const discount = calculatePromotionDiscount(
      { code: "KIWI20", kind: "percentage", value: 20, currency: null },
      quote,
    );

    // 20% of the 200 base fare.
    expect(discount).toBe(40);
  });

  it("takes 10 percent off", () => {
    const discount = calculatePromotionDiscount(
      { code: "AUTUMN10", kind: "percentage", value: 10, currency: null },
      quote,
    );

    // 10% of the 200 base fare.
    expect(discount).toBe(20);
  });

  it("never discounts more than the quote is worth", () => {
    const discount = calculatePromotionDiscount(
      { code: "EVERYTHING", kind: "percentage", value: 200, currency: null },
      quote,
    );

    expect(discount).toBe(200);
  });
});

describe("fixed promotions", () => {
  it("takes the stated amount off", () => {
    const discount = calculatePromotionDiscount(
      { code: "WINTER50", kind: "fixed", value: 50, currency: "NZD" },
      quote,
    );

    expect(discount).toBe(50);
  });
});
