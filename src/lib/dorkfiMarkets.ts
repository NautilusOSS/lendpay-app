/**
 * DorkFi Algorand mainnet USDC markets.
 * API path uses `appId` = pool application id and `marketId` = market (inner) application id
 * (see https://dorkfi-api.nautilus.sh/api-docs/ → User Data → POST …/user/{user}/{network}/{appId}/{marketId}).
 *
 * Legacy pool ids live on `migration` for indexer / future migrations — not wired in UI yet.
 */
export const DORKFI_API_BASE = "https://dorkfi-api.nautilus.sh";

export const DORKFI_ALGORAND_NETWORK = "algorand-mainnet" as const;

export type DorkfiAlgorandMarket = {
  poolAppId: string;
  marketAppId: string;
  assetId: string;
  nTokenId: string;
  decimals: number;
  name: string;
  symbol: string;
  logoPath: string;
  tokenStandard: string;
  /** Prior pool app id — placeholder for migration-aware flows. */
  migrationPoolAppId?: string;
};

export const DORKFI_ALGORAND_USDC_MARKETS: DorkfiAlgorandMarket[] = [
  {
    assetId: "31566704",
    poolAppId: "3333688282",
    marketAppId: "3210682240",
    nTokenId: "3333764003",
    decimals: 6,
    name: "USD Coin",
    symbol: "USDC",
    logoPath: "/lovable-uploads/USDC.webp",
    tokenStandard: "asa",
    migrationPoolAppId: "3207735602",
  },
  {
    assetId: "31566704",
    poolAppId: "3345940978",
    marketAppId: "3210682240",
    nTokenId: "3494389084",
    decimals: 6,
    name: "USD Coin",
    symbol: "USDC",
    logoPath: "/lovable-uploads/USDC.webp",
    tokenStandard: "asa",
  },
];
