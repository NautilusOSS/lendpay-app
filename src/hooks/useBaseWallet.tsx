import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export interface StoredWallet {
  id: string;
  name: string;
  address: string;
}

interface BaseWalletValue {
  wallet: StoredWallet | null;
  status: ConnectionStatus;
  openConnectModal: () => void;
  disconnect: () => void;
  // Kept for backwards compatibility with previous mock API.
  setStatus: (s: ConnectionStatus) => void;
  setConnected: (info: { wallet: string; address: string }) => void;
}

/**
 * Thin adapter over wagmi + RainbowKit that preserves the previous
 * `useBaseWallet` shape consumed by the onboarding step and the header pill.
 */
export const useBaseWallet = (): BaseWalletValue => {
  const { address, connector, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const wallet: StoredWallet | null =
    isConnected && address
      ? {
          id: connector?.id ?? "wallet",
          name: connector?.name ?? "Wallet",
          address,
        }
      : null;

  const status: ConnectionStatus = isConnected
    ? "connected"
    : isConnecting || isReconnecting
      ? "connecting"
      : "idle";

  return {
    wallet,
    status,
    openConnectModal: () => openConnectModal?.(),
    disconnect: () => disconnect(),
    setStatus: () => {
      /* no-op: status is derived from wagmi */
    },
    setConnected: () => {
      /* no-op: connection handled by wagmi */
    },
  };
};

// Provider kept as a no-op passthrough for any existing imports.
export const BaseWalletProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
