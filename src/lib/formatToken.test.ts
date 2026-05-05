import { describe, expect, it } from "vitest";
import { bigintToUiNumber, formatTokenAmount } from "./formatToken";

describe("bigintToUiNumber", () => {
  it("converts 1 USDC (6 decimals)", () => {
    expect(bigintToUiNumber(1_000_000n, 6)).toBe(1);
  });

  it("returns 0 for out-of-range decimals", () => {
    expect(bigintToUiNumber(1n, -1)).toBe(0);
    expect(bigintToUiNumber(1n, 19)).toBe(0);
  });

  it("handles zero amount", () => {
    expect(bigintToUiNumber(0n, 6)).toBe(0);
  });
});

describe("formatTokenAmount", () => {
  it("formats whole units", () => {
    expect(formatTokenAmount(5_000_000n, 6)).toBe("5");
  });

  it("formats fractional smallest units", () => {
    const s = formatTokenAmount(1_500_000n, 6, 6);
    expect(s).toMatch(/1\.5/);
  });
});
