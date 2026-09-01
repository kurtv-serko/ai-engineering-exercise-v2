import { describe, expect, it } from "vitest";

import { clampToZero, formatMoney, percentageOf } from "../src/money.js";

describe("percentageOf", () => {
  it("computes basis points of an amount", () => {
    expect(percentageOf(42_000, 1_200)).toBe(5_040);
    expect(percentageOf(10_000, 250)).toBe(250);
  });

  it("rounds half up", () => {
    // 8900 * 700 / 10000 = 623.0
    expect(percentageOf(8_900, 700)).toBe(623);
    // 1 * 5000 / 10000 = 0.5, rounds up.
    expect(percentageOf(1, 5_000)).toBe(1);
    // 1 * 4999 / 10000 = 0.4999, rounds down.
    expect(percentageOf(1, 4_999)).toBe(0);
  });

  it("returns zero for a zero rate", () => {
    expect(percentageOf(42_000, 0)).toBe(0);
  });

  it("always returns an integer", () => {
    for (const bps of [1, 37, 333, 1_234, 9_999]) {
      expect(Number.isInteger(percentageOf(51_137, bps))).toBe(true);
    }
  });

  it("rejects a negative rate", () => {
    expect(() => percentageOf(42_000, -1)).toThrow(RangeError);
  });

  it("rejects a non-integer amount, which would mean a float leaked in", () => {
    expect(() => percentageOf(420.5, 1_200)).toThrow(TypeError);
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
  it("renders minor units as a currency amount", () => {
    expect(formatMoney(62_960, "NZD")).toContain("629.60");
  });

  it("renders zero", () => {
    expect(formatMoney(0, "NZD")).toContain("0.00");
  });
});
