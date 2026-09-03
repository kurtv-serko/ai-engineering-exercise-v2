import { describe, expect, it } from "vitest";

import { clampToZero, formatMoney, percentOf, roundMoney } from "../src/money.js";

describe("roundMoney", () => {
  it("rounds to the nearest cent", () => {
    expect(roundMoney(50.400000000000006)).toBe(50.4);
    expect(roundMoney(1 / 3)).toBe(0.33);
  });

  it("leaves an amount already at cent precision alone", () => {
    expect(roundMoney(420)).toBe(420);
    expect(roundMoney(86.5)).toBe(86.5);
  });
});

describe("percentOf", () => {
  it("computes a percentage of an amount", () => {
    expect(percentOf(420, 12)).toBe(50.4);
    expect(percentOf(100, 2.5)).toBe(2.5);
  });

  it("rounds the result to the nearest cent", () => {
    expect(percentOf(89, 7)).toBe(6.23);
  });

  it("returns zero for a zero rate", () => {
    expect(percentOf(420, 0)).toBe(0);
  });

  it("never returns more decimal places than a cent", () => {
    for (const percent of [1, 3.7, 33.3, 12.34, 99.99]) {
      const result = percentOf(511.37, percent);
      expect(roundMoney(result)).toBe(result);
    }
  });
});

describe("clampToZero", () => {
  it("leaves a positive amount alone", () => {
    expect(clampToZero(1)).toBe(1);
  });

  it("floors a negative amount at zero", () => {
    expect(clampToZero(-1)).toBe(0);
  });
});

describe("formatMoney", () => {
  it("renders a decimal amount as a currency string", () => {
    expect(formatMoney(629.6, "NZD")).toContain("629.60");
  });

  it("renders zero", () => {
    expect(formatMoney(0, "NZD")).toContain("0.00");
  });
});
