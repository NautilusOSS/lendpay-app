const EVM_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ALGO_REGEX = /^[A-Z2-7]{58}$/;

export type WalletAddressKind = "evm" | "algorand";

export const detectWalletAddressKind = (raw: string): WalletAddressKind | null => {
  const v = raw.trim();
  if (EVM_REGEX.test(v)) return "evm";
  if (ALGO_REGEX.test(v)) return "algorand";
  return null;
};
