import { ArrowRight, ArrowLeft, Link2, Check, ShieldCheck } from "lucide-react";
import { GlowButton } from "../GlowButton";
import { useBaseWallet } from "@/hooks/useBaseWallet";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export const Step4Connect = ({ onNext, onBack }: Props) => {
  const { wallet, status, openConnectModal, disconnect } = useBaseWallet();
  const continueDisabled = !wallet || status === "connecting";

  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Link2 className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Connect Payment Wallet</h3>
          <p className="text-sm text-muted-foreground">
            Pay with USDC on Base. No wallet required on the destination chain.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-secondary/30 p-6 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-primary/30 blur-2xl" />
          <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            {wallet ? (
              <Check className="h-8 w-8 text-primary-foreground" strokeWidth={3} />
            ) : (
              <Link2 className="h-8 w-8 text-primary-foreground" />
            )}
          </div>
        </div>

        {wallet ? (
          <>
            <div className="text-sm font-semibold">{wallet.name} connected</div>
            <div className="text-xs font-mono text-muted-foreground mt-1 break-all max-w-xs">
              {wallet.address} · Base
            </div>
            <div className="mt-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs border border-success/20">
              Ready to pay
            </div>
            <button
              onClick={disconnect}
              className="mt-3 text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold">Choose a wallet</div>
            <div className="text-xs text-muted-foreground mt-1">
              WalletConnect · MetaMask · Coinbase · Rainbow
            </div>
            <button
              onClick={openConnectModal}
              className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all duration-300"
            >
              Connect Base Wallet
            </button>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-success" /> Non-custodial · You approve every transfer
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </GlowButton>
        <GlowButton onClick={onNext} disabled={continueDisabled}>
          Continue <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>
    </div>
  );
};
