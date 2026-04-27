import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { ConnectionStatus } from "@/components/lendpay/ConnectWalletModal";

const STORAGE_KEY = "lendpay:base-wallet";

export interface StoredWallet {
  id: string;
  name: string;
  address: string;
}

const LABEL_MAP: Record<string, string> = {
  walletconnect: "WalletConnect",
  metamask: "MetaMask",
  coinbase: "Coinbase Wallet",
};

interface BaseWalletContextValue {
  wallet: StoredWallet | null;
  status: ConnectionStatus;
  setStatus: (s: ConnectionStatus) => void;
  setConnected: (info: { wallet: string; address: string }) => void;
  disconnect: () => void;
}

const BaseWalletContext = createContext<BaseWalletContextValue | null>(null);

export const BaseWalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<StoredWallet | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredWallet;
        if (parsed?.address && parsed?.name) {
          setWallet(parsed);
          setStatus("connected");
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setConnected = useCallback(({ wallet: id, address }: { wallet: string; address: string }) => {
    const next: StoredWallet = { id, name: LABEL_MAP[id] ?? "Wallet", address };
    setWallet(next);
    setStatus("connected");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setStatus("idle");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <BaseWalletContext.Provider value={{ wallet, status, setStatus, setConnected, disconnect }}>
      {children}
    </BaseWalletContext.Provider>
  );
};

export const useBaseWallet = () => {
  const ctx = useContext(BaseWalletContext);
  if (!ctx) throw new Error("useBaseWallet must be used inside BaseWalletProvider");
  return ctx;
};
