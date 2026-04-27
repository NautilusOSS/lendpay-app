import { useState } from "react";
import { ArrowRight, ArrowLeft, Link2, Check } from "lucide-react";
import { GlowButton } from "../GlowButton";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export const Step4Connect = ({ onNext, onBack }: Props) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
    }, 1200);
  };

  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Link2 className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Connect Payment Wallet</h3>
          <p className="text-sm text-muted-foreground">Pay with USDC on Base. No wallet required on the destination chain.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-secondary/30 p-6 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-primary/30 blur-2xl" />
          <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            {connected ? <Check className="h-8 w-8 text-primary-foreground" strokeWidth={3} /> : <Link2 className="h-8 w-8 text-primary-foreground" />}
          </div>
        </div>

        {connected ? (
          <>
            <div className="text-sm font-semibold">Wallet connected</div>
            <div className="text-xs font-mono text-muted-foreground mt-1">0x84F2...9e3A · Base</div>
            <div className="mt-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs border border-success/20">
              Ready to pay
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold">Choose a wallet</div>
            <div className="text-xs text-muted-foreground mt-1">WalletConnect · MetaMask · Coinbase</div>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 disabled:opacity-60"
            >
              {connecting ? "Connecting..." : "Connect Base Wallet"}
            </button>
          </>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </GlowButton>
        <GlowButton onClick={onNext} disabled={!connected}>
          Continue <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>
    </div>
  );
};
