import { describe, expect, it } from "vitest";

import {
  applyReduction,
  capReduction,
  discountableBasis,
  grossTotal,
  negotiatedReduction,
  passThroughTotal,
} from "../src/domain/pricing/rules.js";
import { domestic, longHaul, taxFree } from "./support/fixtures.js";

describe("grossTotal", () => {
  it("sums the three components", () => {
    expect(grossTotal(longHaul())).toBe(68_000);
  });
});

describe("passThroughTotal", () => {
  it("is taxes plus carrier fees", () => {
    expect(passThroughTotal(longHaul())).toBe(26_000);
  });
});

describe("discountableBasis (invariant D1)", () => {
  it("is the base fare, not the gross total", () => {
    const itinerary = longHaul();
    expect(discountableBasis(itinerary)).toBe(42_000);
    expect(discountableBasis(itinerary)).not.toBe(grossTotal(itinerary));
  });

  it("excludes taxes and carrier fees entirely", () => {
    const itinerary = longHaul();
    expect(grossTotal(itinerary) - discountableBasis(itinerary)).toBe(
      passThroughTotal(itinerary),
    );
  });

  it("shrinks by anything already reduced", () => {
    expect(discountableBasis(longHaul(), 10_000)).toBe(32_000);
  });

  it("never goes negative", () => {
    expect(discountableBasis(longHaul(), 99_999)).toBe(0);
  });
});

describe("capReduction (invariant D2)", () => {
  it("passes through a reduction that fits", () => {
    expect(capReduction(longHaul(), 5_000)).toBe(5_000);
  });

  it("caps a reduction larger than the base fare", () => {
    expect(capReduction(longHaul(), 60_000)).toBe(42_000);
  });

  it("caps against what is left when something was already applied", () => {
    expect(capReduction(longHaul(), 40_000, 10_000)).toBe(32_000);
  });
});

describe("applyReduction", () => {
  it("subtracts the reduction from the gross total", () => {
    expect(applyReduction(longHaul(), 5_000)).toBe(63_000);
  });

  it("never takes the payable below the pass-through component", () => {
    const itinerary = longHaul();
    // Ask for far more than the base fare.
    const payable = applyReduction(itinerary, 1_000_000);
    expect(payable).toBe(passThroughTotal(itinerary));
    expect(payable).toBe(26_000);
  });

  it("composes reductions against the remaining basis (invariant D3)", () => {
    const itinerary = longHaul();
    const first = 5_040;
    const second = capReduction(itinerary, 40_000, first);

    expect(second).toBe(36_960);
    expect(applyReduction(itinerary, second, first)).toBe(26_000);
  });
});

describe("negotiatedReduction", () => {
  it("takes the corporate percentage off the base fare only", () => {
    // 12% of the 42000 base fare, not of the 68000 gross.
    expect(negotiatedReduction(longHaul(), 1_200)).toBe(5_040);
  });

  it("is zero for an organisation with no deal", () => {
    expect(negotiatedReduction(longHaul(), 0)).toBe(0);
  });

  it("rounds half up and stays in integer minor units", () => {
    // 12% of 8900 is 1068 exactly; 7% is 623.
    expect(negotiatedReduction(domestic(), 1_200)).toBe(1_068);
    expect(negotiatedReduction(domestic(), 700)).toBe(623);
  });

  it("cannot exceed the base fare even at 100%", () => {
    const itinerary = longHaul();
    expect(negotiatedReduction(itinerary, 10_000)).toBe(itinerary.baseFareMinor);
  });
});

describe("arithmetic edge cases", () => {
  // The tax-free fixture is only safe here: these assertions are about
  // clamping and rounding, not about which basis is used.
  it("clamps a payable total at zero", () => {
    expect(applyReduction(taxFree(), 20_000)).toBe(0);
  });

  it("returns whole minor units", () => {
    expect(Number.isInteger(negotiatedReduction(taxFree(), 3_333))).toBe(true);
  });
});
