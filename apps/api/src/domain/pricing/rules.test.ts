import { roundMoney } from "@farepath/shared";
import { describe, expect, it } from "vitest";

import {
  applyReduction,
  capReduction,
  discountableBasis,
  grossTotal,
  negotiatedReduction,
  passThroughTotal,
} from "./rules.js";
import { domestic, longHaul, taxFree } from "../../testing/fixtures.js";

describe("grossTotal", () => {
  it("sums the three components", () => {
    expect(grossTotal(longHaul())).toBe(680);
  });
});

describe("passThroughTotal", () => {
  it("is taxes plus carrier fees", () => {
    expect(passThroughTotal(longHaul())).toBe(260);
  });
});

describe("discountableBasis (invariant D1)", () => {
  it("is the base fare, not the gross total", () => {
    const itinerary = longHaul();
    expect(discountableBasis(itinerary)).toBe(420);
    expect(discountableBasis(itinerary)).not.toBe(grossTotal(itinerary));
  });

  it("excludes taxes and carrier fees entirely", () => {
    const itinerary = longHaul();
    expect(grossTotal(itinerary) - discountableBasis(itinerary)).toBe(
      passThroughTotal(itinerary),
    );
  });

  it("shrinks by anything already reduced", () => {
    expect(discountableBasis(longHaul(), 100)).toBe(320);
  });

  it("never goes negative", () => {
    expect(discountableBasis(longHaul(), 999.99)).toBe(0);
  });
});

describe("capReduction (invariant D2)", () => {
  it("passes through a reduction that fits", () => {
    expect(capReduction(longHaul(), 50)).toBe(50);
  });

  it("caps a reduction larger than the base fare", () => {
    expect(capReduction(longHaul(), 600)).toBe(420);
  });

  it("caps against what is left when something was already applied", () => {
    expect(capReduction(longHaul(), 400, 100)).toBe(320);
  });
});

describe("applyReduction", () => {
  it("subtracts the reduction from the gross total", () => {
    expect(applyReduction(longHaul(), 50)).toBe(630);
  });

  it("never takes the payable below the pass-through component", () => {
    const itinerary = longHaul();
    // Ask for far more than the base fare.
    const payable = applyReduction(itinerary, 10000);
    expect(payable).toBe(passThroughTotal(itinerary));
    expect(payable).toBe(260);
  });

  it("composes reductions against the remaining basis (invariant D3)", () => {
    const itinerary = longHaul();
    const first = 50.4;
    const second = capReduction(itinerary, 400, first);

    expect(second).toBe(369.6);
    expect(applyReduction(itinerary, second, first)).toBe(260);
  });
});

describe("negotiatedReduction", () => {
  it("takes the corporate percentage off the base fare only", () => {
    // 12% of the 420 base fare, not of the 680 gross.
    expect(negotiatedReduction(longHaul(), 12)).toBe(50.4);
  });

  it("is zero for an organisation with no deal", () => {
    expect(negotiatedReduction(longHaul(), 0)).toBe(0);
  });

  it("rounds to the nearest cent", () => {
    // 12% of 89 is 10.68 exactly; 7% is 6.23.
    expect(negotiatedReduction(domestic(), 12)).toBe(10.68);
    expect(negotiatedReduction(domestic(), 7)).toBe(6.23);
  });

  it("cannot exceed the base fare even at 100%", () => {
    const itinerary = longHaul();
    expect(negotiatedReduction(itinerary, 100)).toBe(itinerary.baseFare);
  });
});

describe("arithmetic edge cases", () => {
  // The tax-free fixture is only safe here: these assertions are about
  // clamping and rounding, not about which basis is used.
  it("clamps a payable total at zero", () => {
    expect(applyReduction(taxFree(), 200)).toBe(0);
  });

  it("never returns more precision than a cent", () => {
    const result = negotiatedReduction(taxFree(), 33.33);
    expect(roundMoney(result)).toBe(result);
  });
});
