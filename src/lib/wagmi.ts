import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base } from "wagmi/chains";

// Publishable WalletConnect Cloud projectId. Safe to ship in client code.
// Override via VITE_WC_PROJECT_ID at build time, or replace the fallback here.
const projectId =
  (import.meta.env.VITE_WC_PROJECT_ID as string | undefined) ??
  "REPLACE_WITH_YOUR_WALLETCONNECT_PROJECT_ID";

export const wagmiConfig = getDefaultConfig({
  appName: "LendPay",
  projectId,
  chains: [base],
  ssr: false,
});
