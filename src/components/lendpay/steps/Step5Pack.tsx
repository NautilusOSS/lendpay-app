import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Package, Check, AlertTriangle, ArrowUpRight, Sparkles } from "lucide-react";
import { GlowButton } from "../GlowButton";
import { cn } from "@/lib/utils";
import { PACKS, type Pack } from "@/lib/packs";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { TopUpRouteModal } from "../TopUpRouteModal";

interface Props {
  /** Repay amount chosen in Step 3 (in USDC-equivalent units). */
  repayAmount: number;
  initialPackId?: string;
  onNext: (pack: Pack) => void;
  onBack: () => void;
}

const NETWORK_FEE = 0.05;

/**
 * Pack selection step.
 *
 * Filtering rule (per product decision):
 *   - Show only the smallest pack that covers (repayAmount + network fee).
 *   - Plus one tier above as an upsell (if it exists).
 * If nothing in PACKS covers the required amount, render an empty state with
 * a Top up CTA that opens the shared TopUpRouteModal.
 */
export const Step5Pack = ({ repayAmount, initialPackId, onNext, onBack }: Props) => {
  const required = repayAmount + NETWORK_FEE;
  const { isConnected, formatted: usdcBalance } = useUsdcBalance();

  // Sorted ascending so we can take the first qualifying tier + the next one.
  const visible = useMemo(() => {
    const sorted = [...PACKS].sort((a, b) => a.amountUsdc - b.amountUsdc);
    const idx = sorted.findIndex((p) => p.amountUsdc >= required);
    if (idx === -1) return [];
    return sorted.slice(idx, idx + 2); // smallest covering + 1 upsell
  }, [required]);

  const fallbackId = initialPackId && visible.some((p) => p.id === initialPackId)
    ? initialPackId
    : visible[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(fallbackId);
  const selected = visible.find((p) => p.id === selectedId) ?? null;

  const [topUpOpen, setTopUpOpen] = useState(false);
  // Shortfall for the smallest pack we'd want, so the top-up modal pre-fills it.
  const smallestCovering = visible[0]?.amountUsdc ?? required;
  const shortfall = Math.max(0, smallestCovering - (isConnected ? usdcBalance : 0));

  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Package className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Select a pack</h3>
          <p className="text-sm text-muted-foreground">
            Smallest USDC bundle that covers your {repayAmount} repay + {NETWORK_FEE} fee.
          </p>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 flex flex-col items-center text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
          <div className="text-sm font-semibold">No pack covers this repayment</div>
          <div className="text-xs text-muted-foreground mt-1 max-w-sm">
            You need at least {required.toFixed(2)} USDC. Top up with one of the
            external routes, then come back to pick a pack.
          </div>
          <button
            onClick={() => setTopUpOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/40"
          >
            Top up USDC <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div
            role="radiogroup"
            aria-label="Top-up pack"
            className={cn(
              "grid gap-3",
              visible.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1",
            )}
          >
            {visible.map((pack, i) => {
              const active = pack.id === selectedId;
              const isUpsell = i === 1;
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
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {pack.label}
                    {!isUpsell && (
                      <span className="rounded-full bg-success/15 text-success px-2 py-0.5 text-[10px] normal-case tracking-normal font-semibold">
                        Recommended
                      </span>
                    )}
                    {isUpsell && (
                      <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] normal-case tracking-normal font-semibold inline-flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> Headroom
                      </span>
                    )}
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
        </>
      )}

      <div className="mt-8 flex items-center justify-between">
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </GlowButton>
        <GlowButton
          onClick={() => selected && onNext(selected)}
          disabled={visible.length === 0 || !selected}
          title={visible.length === 0 ? "Top up USDC to unlock a pack" : undefined}
          aria-disabled={visible.length === 0 || !selected}
        >
          Continue <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>

      <TopUpRouteModal
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        shortfall={shortfall}
      />
    </div>
  );
};
