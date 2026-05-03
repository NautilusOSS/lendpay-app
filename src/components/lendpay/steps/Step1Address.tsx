import { useState } from "react";
import { ArrowRight, Wallet, AlertCircle } from "lucide-react";
import { GlowButton } from "../GlowButton";
import { detectWalletAddressKind, type WalletAddressKind } from "@/lib/walletAddress";

interface Props {
  onNext: (address: string, kind: WalletAddressKind) => void;
}

export const Step1Address = ({ onNext }: Props) => {
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmed = address.trim();
  const kind = detectWalletAddressKind(trimmed);
  const isValid = kind !== null;

  const handleSubmit = () => {
    if (!trimmed) {
      setError("Please enter a wallet address.");
      return;
    }
    if (!isValid) {
      setError("Invalid address. Use a 0x EVM address (42 chars) or an Algorand address (58 chars).");
      return;
    }
    setError(null);
    onNext(trimmed, kind);
  };

  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Enter wallet address</h3>
          <p className="text-sm text-muted-foreground">We'll detect your active loan position automatically.</p>
        </div>
      </div>

      <div className="mt-8">
        <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Wallet address</label>
        <input
          autoFocus
          value={address}
          onChange={(e) => { setAddress(e.target.value); if (error) setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="0x... or Algorand address"
          aria-invalid={!!error}
          className={`mt-2 w-full bg-input/60 border rounded-xl px-4 py-3.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all ${
            error
              ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
              : "border-border focus:border-primary/60 focus:ring-primary/20"
          }`}
        />
        <div className="mt-2 min-h-[20px] text-xs">
          {error ? (
            <p className="flex items-center gap-1.5 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          ) : isValid ? (
            <p className="text-primary/80">
              Detected {kind === "evm" ? "EVM (0x)" : "Algorand"} address ✓
            </p>
          ) : (
            <p className="text-muted-foreground/70">
              Supports EVM (0x, 42 chars) and Algorand (58 chars) addresses.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <GlowButton onClick={handleSubmit} disabled={!isValid}>
          Continue <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>
    </div>
  );
};
