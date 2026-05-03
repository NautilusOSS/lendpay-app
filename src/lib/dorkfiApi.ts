import {
  DORKFI_ALGORAND_NETWORK,
  DORKFI_ALGORAND_USDC_MARKETS,
  DORKFI_API_BASE,
  type DorkfiAlgorandMarket,
} from "./dorkfiMarkets";

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
  borrowUnderlying: bigint;
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
    const borrowUnderlying = underlyingFromScaledBorrow(userData.scaledBorrows, userData.borrowIndex);
    if (borrowUnderlying === 0n) continue;
    const health = await getUserHealth(userAddress, market.poolAppId);
    return { market, userData, health, borrowUnderlying };
  }
  return null;
}
