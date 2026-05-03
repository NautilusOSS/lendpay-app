/** Minimum partial repayment amount in repay-asset units (interest / custom). */
export const MIN_REPAY_AMOUNT = 0.1;

/** Demo presets when no on-chain borrow snapshot exists (EVM / no position). */
export const DEMO_REPAY_FULL = 610.016559;
/** Below `MIN_REPAY_AMOUNT`; demo flow hides “interest only” and defaults to full/custom. */
export const DEMO_REPAY_INTEREST = 0.016465;
export const DEMO_REPAY_CUSTOM_SEED = 100;

export type RepayBorrowSnapshot = {
  repayAssetSymbol: string;
  /** Total borrow owed (human units), same basis as step 2 “Borrow balance”. */
  fullBorrow: number;
  /** Accrued interest since last position index (human units); may be tiny. */
  accruedInterest: number;
  decimals: number;
};

export function demoRepaySnapshot(repayAssetSymbol: string): RepayBorrowSnapshot {
  return {
    repayAssetSymbol,
    fullBorrow: DEMO_REPAY_FULL,
    accruedInterest: DEMO_REPAY_INTEREST,
    decimals: 6,
  };
}
