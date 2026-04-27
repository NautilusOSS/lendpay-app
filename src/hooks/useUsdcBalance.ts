import { useAccount, useReadContract } from "wagmi";
import { base } from "wagmi/chains";
import { formatUnits } from "viem";

// Native USDC on Base mainnet
export const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const USDC_DECIMALS = 6;

const erc20BalanceOfAbi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface UsdcBalance {
  isConnected: boolean;
  address?: `0x${string}`;
  raw?: bigint;
  formatted: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/** Reads USDC balance for the connected wallet on Base. */
export const useUsdcBalance = (): UsdcBalance => {
  const { address, isConnected } = useAccount();

  const { data, isLoading, isError, refetch } = useReadContract({
    abi: erc20BalanceOfAbi,
    address: USDC_BASE_ADDRESS,
    functionName: "balanceOf",
    chainId: base.id,
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && isConnected),
      refetchInterval: 15_000,
    },
  });

  const raw = (data as bigint | undefined) ?? undefined;
  const formatted = raw ? Number(formatUnits(raw, USDC_DECIMALS)) : 0;

  return {
    isConnected,
    address,
    raw,
    formatted,
    isLoading,
    isError,
    refetch: () => {
      void refetch();
    },
  };
};
