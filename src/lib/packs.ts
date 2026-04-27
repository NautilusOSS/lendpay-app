// Pack tiers for LendPay's x402 / KeeperHub workflow top-ups.
// Add new tiers here — UI auto-extends.
// Default selection: the demo pack (0.10 USDC) so the user always has a sane
// starting point but can still change it explicitly before paying.

export interface Pack {
  id: string;
  label: string;
  amountUsdc: number;
  helper?: string;
}

export const PACKS: Pack[] = [
  { id: "demo", label: "Demo", amountUsdc: 0.1, helper: "Hackathon demo · 0.10 USDC" },
  { id: "p1", label: "1 USDC", amountUsdc: 1 },
  { id: "p2", label: "2 USDC", amountUsdc: 2 },
  { id: "p5", label: "5 USDC", amountUsdc: 5, helper: "Most common" },
  { id: "p10", label: "10 USDC", amountUsdc: 10 },
  { id: "p20", label: "20 USDC", amountUsdc: 20 },
  { id: "p50", label: "50 USDC", amountUsdc: 50 },
  { id: "p100", label: "100 USDC", amountUsdc: 100 },
];

export const DEFAULT_PACK_ID = "demo";

export const getPackById = (id: string): Pack | undefined =>
  PACKS.find((p) => p.id === id);
