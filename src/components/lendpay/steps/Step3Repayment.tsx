import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowLeft, Coins, Wallet, AlertTriangle, CheckCircle2, RefreshCw, Loader2, ArrowUpRight } from "lucide-react";
import { GlowButton } from "../GlowButton";
import { cn } from "@/lib/utils";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { TopUpRouteModal } from "../TopUpRouteModal";

type Option = "interest" | "custom" | "full";

interface Props {
  onNext: (amount: number) => void;
  onBack: () => void;
}

const options: { id: Option; label: string; desc: string; value: number }[] = [
  { id: "interest", label: "Repay Interest Only", desc: "Pay just the accrued interest", value: 0.016465 },
  { id: "custom", label: "Custom Amount", desc: "Choose any partial amount", value: 100 },
  { id: "full", label: "Full Repayment", desc: "Close out the entire position", value: 610.016559 },
];

export const Step3Repayment = ({ onNext, onBack }: Props) => {
  const [selected, setSelected] = useState<Option>("interest");
  const [custom, setCustom] = useState("100");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [pendingRecheck, setPendingRecheck] = useState(false);
  const awaitingReturnRef = useRef(false);
  const current = options.find((o) => o.id === selected)!;
  const amount = selected === "custom" ? Number(custom) || 0 : current.value;

  const NETWORK_FEE = 0.05;
  const required = amount + NETWORK_FEE;
  const { isConnected, formatted: usdcBalance, isLoading, isError, refetch } = useUsdcBalance();
  const hasEnough = isConnected && usdcBalance >= required;
  const shortfall = Math.max(0, required - usdcBalance);
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });

  // Auto-recheck balance when the user returns to this tab after opening a top-up route.
  useEffect(() => {
    const handleReturn = () => {
      if (!awaitingReturnRef.current) return;
      if (document.visibilityState !== "visible") return;
      awaitingReturnRef.current = false;
      setPendingRecheck(true);
      // small delay so on-chain balance has time to settle after a swap/withdrawal
      const t = window.setTimeout(() => {
        refetch();
        // clear the indicator shortly after kicking off refetch
        window.setTimeout(() => setPendingRecheck(false), 1500);
      }, 800);
      return () => window.clearTimeout(t);
    };
    document.addEventListener("visibilitychange", handleReturn);
    window.addEventListener("focus", handleReturn);
    return () => {
      document.removeEventListener("visibilitychange", handleReturn);
      window.removeEventListener("focus", handleReturn);
    };
  }, [refetch]);

  const handleRouteOpened = () => {
    awaitingReturnRef.current = true;
  };

  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Coins className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Choose repayment</h3>
          <p className="text-sm text-muted-foreground">Pick how much you want to settle.</p>
        </div>
      </div>

      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={cn(
              "w-full text-left rounded-xl border p-4 transition-all duration-300",
              selected === opt.id
                ? "border-primary/60 bg-primary/5 shadow-[0_0_25px_hsl(var(--primary)/0.15)]"
                : "border-border bg-secondary/20 hover:border-border/80 hover:bg-secondary/40"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  selected === opt.id ? "border-primary" : "border-muted-foreground/40"
                )}
              >
                {selected === opt.id && <div className="h-2 w-2 rounded-full bg-gradient-to-br from-primary to-accent" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.desc}</div>
              </div>
              <div className="text-sm font-mono text-muted-foreground">
                {opt.id === "custom" ? "—" : `${opt.value} WAD`}
              </div>
            </div>
            {selected === "custom" && opt.id === "custom" && (
              <div className="mt-4 pl-8 animate-fade-in">
                <input
                  type="number"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/60"
                  placeholder="0.0"
                />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Calculated amount</span>
          <span className="text-lg font-bold font-mono text-gradient">{amount} WAD</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Network fee</span>
          <span className="text-sm font-mono">0.05 USDC <span className="text-muted-foreground">on Base</span></span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-secondary/20 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              USDC balance · Base
            </span>
          </div>
          {isConnected && (
            <button
              onClick={refetch}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Refresh balance"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {!isConnected ? (
          <div className="text-sm text-muted-foreground">
            Connect a Base wallet in the next step to check your USDC balance.
          </div>
        ) : isError ? (
          <div className="text-sm text-destructive">Could not load balance. Try refresh.</div>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Available</span>
              <span className="text-base font-semibold font-mono">
                {isLoading && usdcBalance === 0 ? "—" : `${fmt(usdcBalance)} USDC`}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Required (amount + fee)</span>
              <span className="text-sm font-mono">{fmt(required)} USDC</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                hasEnough
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              )}
            >
              {hasEnough ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Sufficient balance to cover this repayment.
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="flex-1">Short by {fmt(shortfall)} USDC. Top up or lower the amount.</span>
                  <button
                    onClick={() => setTopUpOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 font-semibold hover:bg-destructive/20 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/40"
                  >
                    Top up {fmt(shortfall)} USDC <ArrowUpRight className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </GlowButton>
        <GlowButton onClick={() => onNext(amount)}>
          Continue <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>

      <TopUpRouteModal open={topUpOpen} onOpenChange={setTopUpOpen} shortfall={shortfall} />
    </div>
  );
};
