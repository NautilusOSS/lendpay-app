import { useEffect, useState } from "react";
import { Check, Loader2, Circle, PartyPopper, RotateCcw } from "lucide-react";
import { GlowButton } from "../GlowButton";
import { cn } from "@/lib/utils";

interface Props {
  amount: number;
  onReset: () => void;
}

const traceSteps = [
  "Position detected",
  "Market synced",
  "Interest calculated",
  "x402 payment confirmed (Base)",
  "Executing repayment on Algorand",
  "Confirming transaction",
];

export const Step6Trace = ({ amount, onReset }: Props) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (progress >= traceSteps.length) return;
    const t = setTimeout(() => setProgress((p) => p + 1), 1100);
    return () => clearTimeout(t);
  }, [progress]);

  const done = progress >= traceSteps.length;
  const newDebt = (610.016559 - amount).toFixed(6);

  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Execution trace</h3>
        <p className="text-sm text-muted-foreground">Live view of your cross-chain repayment.</p>
      </div>

      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
        <ul className="space-y-4">
          {traceSteps.map((label, i) => {
            const isDone = i < progress;
            const isActive = i === progress && !done;
            const isPending = i > progress;
            return (
              <li key={i} className="relative flex items-center gap-4">
                <div
                  className={cn(
                    "relative z-10 h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                    isDone && "bg-gradient-to-br from-primary to-accent border-transparent shadow-[0_0_15px_hsl(var(--primary)/0.6)]",
                    isActive && "border-primary bg-primary/10",
                    isPending && "border-border bg-card"
                  )}
                >
                  {isDone && <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />}
                  {isActive && <Loader2 className="h-4 w-4 text-primary animate-spin-slow" />}
                  {isPending && <Circle className="h-2 w-2 fill-muted-foreground/40 text-muted-foreground/40" />}
                </div>
                <span
                  className={cn(
                    "text-sm transition-colors",
                    isDone && "text-foreground font-medium",
                    isActive && "text-foreground font-semibold",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-primary animate-pulse">In progress</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {done && (
        <div className="mt-8 rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-primary/5 p-6 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
              <PartyPopper className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-base font-bold">Repayment Complete</div>
              <div className="text-xs text-muted-foreground">Settled on Algorand · Paid on Base</div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-card/60 border border-border/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Repaid</div>
              <div className="mt-1 text-sm font-mono font-semibold">{amount} WAD</div>
            </div>
            <div className="rounded-lg bg-card/60 border border-border/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">New Debt</div>
              <div className="mt-1 text-sm font-mono font-semibold text-gradient">{newDebt} WAD</div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <GlowButton variant="ghost" onClick={onReset}>
              <RotateCcw className="h-4 w-4" /> Start new repayment
            </GlowButton>
          </div>
        </div>
      )}
    </div>
  );
};
