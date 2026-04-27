import { useState } from "react";
import { ArrowRight, Wallet, AlertCircle } from "lucide-react";
import { GlowButton } from "../GlowButton";

interface Props {
  onNext: (address: string) => void;
}

const EVM_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ALGO_REGEX = /^[A-Z2-7]{58}$/;

type AddressKind = "evm" | "algorand" | null;

const detectAddress = (raw: string): AddressKind => {
  const v = raw.trim();
  if (EVM_REGEX.test(v)) return "evm";
  if (ALGO_REGEX.test(v)) return "algorand";
  return null;
};

export const Step1Address = ({ onNext }: Props) => {
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmed = address.trim();
  const kind = detectAddress(trimmed);
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
    onNext(trimmed);
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
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x... or Algorand address"
          className="mt-2 w-full bg-input/60 border border-border rounded-xl px-4 py-3.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="mt-8 flex justify-end">
        <GlowButton onClick={() => onNext(address || "ALGO...XYZ7")}>
          Continue <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>
    </div>
  );
};
