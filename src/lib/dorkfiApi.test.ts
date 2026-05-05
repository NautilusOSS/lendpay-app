import { describe, expect, it } from "vitest";
import { DORKFI_ALGORAND_USDC_MARKETS } from "./dorkfiMarkets";
import {
  type DorkfiResolvedPosition,
  resolvedPositionToRepaySnapshot,
  underlyingFromScaledBorrow,
} from "./dorkfiApi";

describe("underlyingFromScaledBorrow", () => {
  it("returns 0 when scaled borrows is zero", () => {
    expect(underlyingFromScaledBorrow("0", "1000000000000000000")).toBe(0n);
  });

  it("returns 0 when borrow index is zero", () => {
    expect(underlyingFromScaledBorrow("1000", "0")).toBe(0n);
  });

  it("computes underlying = scaled * index / 1e18", () => {
    const scaled = "1000000000000000000"; // 1e18 scaled units
    const index = "2000000000000000000"; // 2e18 index → product 2e36 / 1e18 = 2e18 underlying? 
    // (1e18 * 2e18) / 1e18 = 2e18
    expect(underlyingFromScaledBorrow(scaled, index)).toBe(2n * 10n ** 18n);
  });
});

describe("resolvedPositionToRepaySnapshot", () => {
  const market = DORKFI_ALGORAND_USDC_MARKETS[0]!;

  function position(
    overrides: Partial<Pick<DorkfiResolvedPosition, "totalBorrowUnderlying" | "accruedInterestUnderlying">>,
  ): DorkfiResolvedPosition {
    return {
      market,
      userData: {
        scaledDeposits: "0",
        scaledBorrows: "1",
        depositIndex: "1",
        borrowIndex: "1",
        userAddress: "ADDR",
        appId: 1,
        marketId: 2,
        network: "algorand-mainnet",
      },
      health: null,
      totalBorrowUnderlying: 5_000_000n, // 5 USDC
      accruedInterestUnderlying: 0n,
      ...overrides,
    };
  }

  it("maps totals and DorkFi ids for gateway triggerData fields", () => {
    const snap = resolvedPositionToRepaySnapshot(position({}));
    expect(snap.repayAssetSymbol).toBe("USDC");
    expect(snap.fullBorrow).toBe(5);
    expect(snap.poolAppId).toBe(market.poolAppId);
    expect(snap.marketAppId).toBe(market.marketAppId);
    expect(snap.underlyingAssetId).toBe(market.assetId);
    expect(snap.nTokenId).toBe(market.nTokenId);
  });

  it("floors tiny accrued interest to a display minimum when borrow is non-zero", () => {
    const snap = resolvedPositionToRepaySnapshot(
      position({ accruedInterestUnderlying: 1n, totalBorrowUnderlying: 5_000_000n }),
    );
    expect(snap.fullBorrow).toBe(5);
    expect(snap.accruedInterest).toBeGreaterThan(0);
    expect(snap.accruedInterest).toBeLessThanOrEqual(5 * 0.0001);
  });

  it("preserves meaningful accrued interest above per-token minimum unit", () => {
    const snap = resolvedPositionToRepaySnapshot(
      position({
        totalBorrowUnderlying: 10_000_000n,
        accruedInterestUnderlying: 500_000n, // 0.5 USDC
      }),
    );
    expect(snap.accruedInterest).toBeCloseTo(0.5, 5);
  });
});
