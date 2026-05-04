import { DORKFI_ALGORAND_USDC_MARKETS } from "./dorkfiMarkets";

/** Minimum partial repayment amount in repay-asset units (interest / custom). */
export const MIN_REPAY_AMOUNT = 0.1;

/** Demo presets when no on-chain borrow snapshot exists (EVM / no position). */
export const DEMO_REPAY_FULL = 610.016559;
/** Below `MIN_REPAY_AMOUNT`; demo flow hides “interest only” and defaults to full/custom. */
export const DEMO_REPAY_INTEREST = 0.016465;
export const DEMO_REPAY_CUSTOM_SEED = 100;

/** Algorand app / ASA ids for gateway `triggerData` (DorkFi USDC pool). */
export type RepayBorrowSnapshot = {
  repayAssetSymbol: string;
  /** Total borrow owed (human units), same basis as step 2 “Borrow balance”. */
  fullBorrow: number;
  /** Accrued interest since last position index (human units); may be tiny. */
  accruedInterest: number;
  decimals: number;
  /** Pool application id → `triggerData.poolId`. */
  poolAppId?: string;
  /** Market (inner) app id / “contract” id → `triggerData.marketAppId`. */
  marketAppId?: string;
  /** Underlying repay asset ASA (e.g. USDC `31566704`) → `triggerData.underlyingAssetId`. */
  underlyingAssetId?: string;
  /** Borrow receipt (nToken) ASA → `triggerData.assetId` for repay workflows. */
  nTokenId?: string;
};

function defaultDemoDorkfiIds(): Pick<
  RepayBorrowSnapshot,
  "poolAppId" | "marketAppId" | "underlyingAssetId" | "nTokenId"
> {
  const m = DORKFI_ALGORAND_USDC_MARKETS[0];
  if (!m) return {};
  return {
    poolAppId: m.poolAppId,
    marketAppId: m.marketAppId,
    underlyingAssetId: m.assetId,
    nTokenId: m.nTokenId,
  };
}

export function demoRepaySnapshot(repayAssetSymbol: string): RepayBorrowSnapshot {
  return {
    repayAssetSymbol,
    fullBorrow: DEMO_REPAY_FULL,
    accruedInterest: DEMO_REPAY_INTEREST,
    decimals: 6,
    ...defaultDemoDorkfiIds(),
  };
}
