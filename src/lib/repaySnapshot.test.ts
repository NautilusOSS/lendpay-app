import { describe, expect, it } from "vitest";
import { DORKFI_ALGORAND_USDC_MARKETS } from "./dorkfiMarkets";
import {
  DEMO_REPAY_CUSTOM_SEED,
  DEMO_REPAY_FULL,
  DEMO_REPAY_INTEREST,
  MIN_REPAY_AMOUNT,
  demoRepaySnapshot,
} from "./repaySnapshot";

describe("repaySnapshot demo helpers", () => {
  it("exposes minimum partial repay threshold", () => {
    expect(MIN_REPAY_AMOUNT).toBe(0.1);
    expect(DEMO_REPAY_INTEREST).toBeLessThan(MIN_REPAY_AMOUNT);
  });

  it("demoRepaySnapshot uses first USDC market ids and demo balances", () => {
    const m0 = DORKFI_ALGORAND_USDC_MARKETS[0];
    expect(m0).toBeDefined();
    const snap = demoRepaySnapshot("USDC");
    expect(snap.repayAssetSymbol).toBe("USDC");
    expect(snap.fullBorrow).toBe(DEMO_REPAY_FULL);
    expect(snap.accruedInterest).toBe(DEMO_REPAY_INTEREST);
    expect(snap.decimals).toBe(6);
    expect(snap.poolAppId).toBe(m0!.poolAppId);
    expect(snap.marketAppId).toBe(m0!.marketAppId);
    expect(snap.underlyingAssetId).toBe(m0!.assetId);
    expect(snap.nTokenId).toBe(m0!.nTokenId);
  });

  it("custom demo seed stays stable for UI defaults", () => {
    expect(DEMO_REPAY_CUSTOM_SEED).toBe(100);
  });
});
