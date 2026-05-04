import {
  DORKFI_ALGORAND_NETWORK,
  DORKFI_ALGORAND_USDC_MARKETS,
  DORKFI_API_BASE,
  type DorkfiAlgorandMarket,
} from "./dorkfiMarkets";
import { bigintToUiNumber } from "./formatToken";
import type { RepayBorrowSnapshot } from "./repaySnapshot";

const INDEX_SCALE = 10n ** 18n;

export type DorkfiUserDataRow = {
  scaledDeposits: string;
  scaledBorrows: string;
  depositIndex: string;
  borrowIndex: string;
  userAddress: string;
  appId: number;
  marketId: number;
  network: string;
};

export type DorkfiUserHealth = {
  healthFactor: number;
  totalCollateralValue: string;
  totalBorrowValue: string;
  appId: number;
  userAddress: string;
  network: string;
};

export type DorkfiResolvedPosition = {
  market: DorkfiAlgorandMarket;
  userData: DorkfiUserDataRow;
  health: DorkfiUserHealth | null;
  /** Total borrow using latest market borrow index when available. */
  totalBorrowUnderlying: bigint;
  /** Growth since `userData.borrowIndex` (index accrual). */
  accruedInterestUnderlying: bigint;
};

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string };

const parseJson = async (r: Response): Promise<unknown> => {
  try {
    return await r.json();
  } catch {
    return null;
  }
};

export function underlyingFromScaledBorrow(scaledBorrows: string, borrowIndex: string): bigint {
  const sb = BigInt(scaledBorrows || "0");
  const bi = BigInt(borrowIndex || "0");
  if (sb === 0n || bi === 0n) return 0n;
  return (sb * bi) / INDEX_SCALE;
}

async function getUserData(
  userAddress: string,
  poolAppId: string,
  marketAppId: string,
): Promise<DorkfiUserDataRow | null> {
  const url = `${DORKFI_API_BASE}/user-data/user/${encodeURIComponent(userAddress)}/${DORKFI_ALGORAND_NETWORK}/${poolAppId}/${marketAppId}`;
  const res = await fetch(url);
  const body = (await parseJson(res)) as ApiEnvelope<DorkfiUserDataRow> | null;
  if (!body?.success || !body.data) return null;
  return body.data;
}

async function getUserHealth(userAddress: string, poolAppId: string): Promise<DorkfiUserHealth | null> {
  const url = `${DORKFI_API_BASE}/user-health/${DORKFI_ALGORAND_NETWORK}/${poolAppId}/${encodeURIComponent(userAddress)}`;
  const res = await fetch(url);
  const body = (await parseJson(res)) as ApiEnvelope<DorkfiUserHealth> | null;
  if (!body?.success || !body.data) return null;
  return body.data;
}

async function getMarketBorrowIndex(poolAppId: string, marketAppId: string): Promise<string | null> {
  const url = `${DORKFI_API_BASE}/market-data/${DORKFI_ALGORAND_NETWORK}/${poolAppId}/${marketAppId}`;
  const res = await fetch(url);
  const body = (await parseJson(res)) as ApiEnvelope<{ borrowIndex: string }> | null;
  if (!body?.success || !body.data?.borrowIndex) return null;
  return body.data.borrowIndex;
}

/** Map resolved DorkFi position to repayment step presets (human units). */
export function resolvedPositionToRepaySnapshot(p: DorkfiResolvedPosition): RepayBorrowSnapshot {
  const { market, accruedInterestUnderlying, totalBorrowUnderlying } = p;
  const full = bigintToUiNumber(totalBorrowUnderlying, market.decimals);
  let accrued = bigintToUiNumber(accruedInterestUnderlying, market.decimals);
  const minUnit = 1 / 10 ** market.decimals;
  if (accrued < minUnit && full > 0) {
    accrued = Math.min(full * 0.0001, full);
  }
  return {
    repayAssetSymbol: market.symbol,
    fullBorrow: full,
    accruedInterest: accrued,
    decimals: market.decimals,
    poolAppId: market.poolAppId,
    marketAppId: market.marketAppId,
    underlyingAssetId: market.assetId,
    nTokenId: market.nTokenId,
  };
}

/**
 * Returns the first USDC market where the user has on-chain borrow balance (scaled × index).
 * Indexed-only: addresses never seen on DorkFi return null.
 */
export async function fetchDorkfiAlgorandBorrowPosition(
  userAddress: string,
): Promise<DorkfiResolvedPosition | null> {
  for (const market of DORKFI_ALGORAND_USDC_MARKETS) {
    const userData = await getUserData(userAddress, market.poolAppId, market.marketAppId);
    if (!userData) continue;
    if (BigInt(userData.scaledBorrows || "0") === 0n) continue;
    const marketBorrowIdx = await getMarketBorrowIndex(market.poolAppId, market.marketAppId);
    const idxForTotal = marketBorrowIdx ?? userData.borrowIndex;
    const totalBorrowUnderlying = underlyingFromScaledBorrow(userData.scaledBorrows, idxForTotal);
    if (totalBorrowUnderlying === 0n) continue;
    const atStoredIndex = underlyingFromScaledBorrow(userData.scaledBorrows, userData.borrowIndex);
    const accruedInterestUnderlying =
      totalBorrowUnderlying > atStoredIndex ? totalBorrowUnderlying - atStoredIndex : 0n;
    const health = await getUserHealth(userAddress, market.poolAppId);
    return {
      market,
      userData,
      health,
      totalBorrowUnderlying,
      accruedInterestUnderlying,
    };
  }
  return null;
}
