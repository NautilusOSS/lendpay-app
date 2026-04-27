import { useState } from "react";
import { ArrowRight, ArrowLeft, Package, Check } from "lucide-react";
import { GlowButton } from "../GlowButton";
import { cn } from "@/lib/utils";
import { PACKS, type Pack } from "@/lib/packs";

interface Props {
  initialPackId?: string;
  onNext: (pack: Pack) => void;
  onBack: () => void;
}

/**
 * Step: select a USDC top-up pack for the upcoming x402 / workflow call.
 * Sits after wallet connect and before the pay review step so the chosen
 * pack id + amount flow into payment with no duplicate amount entry.
 */
export const Step5Pack = ({ initialPackId, onNext, onBack }: Props) => {
  // No default selection — force an explicit pick so the user is intentional
  // about the amount being charged.
  const [selectedId, setSelectedId] = useState<string | null>(initialPackId ?? null);
  const selected = PACKS.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Package className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Select a pack</h3>
          <p className="text-sm text-muted-foreground">
            Pick the USDC bundle to fund your workflow run (x402 + repay).
          </p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Top-up pack"
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {PACKS.map((pack) => {
          const active = pack.id === selectedId;
          return (
            <button
              key={pack.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelectedId(pack.id)}
              className={cn(
                "relative text-left rounded-xl border p-4 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                active
                  ? "border-primary/60 bg-primary/5 shadow-[0_0_25px_hsl(var(--primary)/0.15)]"
                  : "border-border bg-secondary/20 hover:border-border/80 hover:bg-secondary/40",
              )}
            >
              {active && (
                <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                </span>
              )}
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {pack.label}
              </div>
              <div className="mt-1 text-xl font-bold font-mono text-gradient">
                {pack.amountUsdc} USDC
              </div>
              {pack.helper && (
                <div className="mt-2 text-[11px] text-muted-foreground">{pack.helper}</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 p-5 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Pack total
        </span>
        <span className="text-lg font-bold font-mono text-gradient">
          {selected ? `${selected.amountUsdc} USDC` : "— USDC"}
        </span>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </GlowButton>
        <GlowButton onClick={() => selected && onNext(selected)} disabled={!selected}>
          Continue <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>
    </div>
  );
};
