import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { GlowButton } from "../GlowButton";

interface Props {
  amount: number;
  repayAssetSymbol: string;
  onNext: () => void;
  onBack: () => void;
}

export const Step5Confirm = ({ amount, repayAssetSymbol, onNext, onBack }: Props) => {
  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Confirm & Execute</h3>
          <p className="text-sm text-muted-foreground">Review your repayment before signing.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-secondary/50 to-secondary/20 p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">You're repaying</div>
        <div className="mt-1 text-3xl font-bold font-mono text-gradient">
          {amount} {repayAssetSymbol}
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Destination chain</span>
            <span className="font-semibold">Algorand</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Protocol</span>
            <span className="font-semibold">DorkFi</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pay with</span>
            <span className="font-semibold font-mono">USDC on Base</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border/60">
            <span className="text-muted-foreground">Fee</span>
            <span className="font-semibold font-mono">0.05 USDC</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </GlowButton>
        <GlowButton onClick={onNext} className="flex-1 sm:flex-none">
          <Sparkles className="h-4 w-4" /> Pay with USDC & Execute
        </GlowButton>
      </div>
    </div>
  );
};
