import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowLeft, Coins, Wallet, AlertTriangle, CheckCircle2, RefreshCw, Loader2, ArrowUpRight, Lightbulb } from "lucide-react";
import { GlowButton } from "../GlowButton";
import { cn } from "@/lib/utils";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { TopUpRouteModal } from "../TopUpRouteModal";
import { DEFAULT_DORKFI_REPAY_SYMBOL } from "@/lib/dorkfiMarkets";
import {
  DEMO_REPAY_CUSTOM_SEED,
  DEMO_REPAY_FULL,
  DEMO_REPAY_INTEREST,
  MIN_REPAY_AMOUNT,
  type RepayBorrowSnapshot,
} from "@/lib/repaySnapshot";

type Option = "interest" | "minimum" | "custom" | "full";

function defaultRepaySelection(snapshot: RepayBorrowSnapshot | null): Option {
  const full = snapshot?.fullBorrow ?? DEMO_REPAY_FULL;
  const rawInterest = snapshot?.accruedInterest ?? DEMO_REPAY_INTEREST;
  const interest = Math.min(Math.max(rawInterest, 0), full);
  const showInterest = interest >= MIN_REPAY_AMOUNT;
  const showMinimum =
    full > MIN_REPAY_AMOUNT && (!showInterest || interest > MIN_REPAY_AMOUNT + 1e-8);
  if (full > 0 && full < MIN_REPAY_AMOUNT) return "full";
  if (showInterest) return "interest";
  if (showMinimum) return "minimum";
  return "full";
}

interface Props {
  /** From step 2 when a borrow exists; otherwise demo presets. */
  borrowSnapshot: RepayBorrowSnapshot | null;
  onNext: (amount: number) => void;
  onBack: () => void;
}

export const Step3Repayment = ({ borrowSnapshot, onNext, onBack }: Props) => {
  const repayAssetSymbol = borrowSnapshot?.repayAssetSymbol ?? DEFAULT_DORKFI_REPAY_SYMBOL;

  const { fullBorrow, interestAmount, decimals, showInterestOption, showMinimumOption } = useMemo(() => {
    const full = borrowSnapshot?.fullBorrow ?? DEMO_REPAY_FULL;
    const rawInterest = borrowSnapshot?.accruedInterest ?? DEMO_REPAY_INTEREST;
    const dec = borrowSnapshot?.decimals ?? 6;
    const interest = Math.min(Math.max(rawInterest, 0), full);
    const showInterest = interest >= MIN_REPAY_AMOUNT;
    const showMinimum =
      full > MIN_REPAY_AMOUNT && (!showInterest || interest > MIN_REPAY_AMOUNT + 1e-8);
    return {
      fullBorrow: full,
      interestAmount: interest,
      decimals: dec,
      showInterestOption: showInterest,
      showMinimumOption: showMinimum,
    };
  }, [borrowSnapshot]);

  const options = useMemo(() => {
    const custom = {
      id: "custom" as const,
      label: "Custom Amount",
      desc: `At least ${MIN_REPAY_AMOUNT} ${repayAssetSymbol} unless paying full debt`,
      value: DEMO_REPAY_CUSTOM_SEED,
    };
    const full = {
      id: "full" as const,
      label: "Full Repayment",
      desc: "Close out the entire position",
      value: fullBorrow,
    };
    const interest = {
      id: "interest" as const,
      label: "Repay Interest Only",
      desc: "Pay accrued interest since last index update",
      value: interestAmount,
    };
    const minimum = {
      id: "minimum" as const,
      label: "Minimum payment",
      desc: `Pay ${MIN_REPAY_AMOUNT} ${repayAssetSymbol} (preset floor; full balance is higher)`,
      value: MIN_REPAY_AMOUNT,
    };
    type Row = typeof interest | typeof minimum | typeof custom | typeof full;
    const parts: Row[] = [];
    if (showInterestOption) parts.push(interest);
    if (showMinimumOption) parts.push(minimum);
    parts.push(custom, full);
    return parts;
  }, [fullBorrow, interestAmount, repayAssetSymbol, showInterestOption, showMinimumOption]);

  const [selected, setSelected] = useState<Option>(() => defaultRepaySelection(borrowSnapshot));
  const [custom, setCustom] = useState("100");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [pendingRecheck, setPendingRecheck] = useState(false);
  const awaitingReturnRef = useRef(false);

  useEffect(() => {
    const seed = Math.min(DEMO_REPAY_CUSTOM_SEED, fullBorrow);
    let nextVal =
      fullBorrow > 0 && fullBorrow < MIN_REPAY_AMOUNT ? fullBorrow : Math.max(MIN_REPAY_AMOUNT, seed);
    nextVal = Math.min(nextVal, fullBorrow);
    const next = Number.isFinite(nextVal) && nextVal > 0 ? nextVal.toFixed(Math.min(decimals, 8)) : "0";
    setCustom(next);
  }, [fullBorrow, decimals, borrowSnapshot]);

  useEffect(() => {
    if (!showInterestOption && selected === "interest") {
      setSelected(showMinimumOption ? "minimum" : "full");
    }
    if (!showMinimumOption && selected === "minimum") {
      setSelected(showInterestOption ? "interest" : "full");
    }
  }, [showInterestOption, showMinimumOption, selected]);

  const current = options.find((o) => o.id === selected) ?? options[0]!;

  const customTrimmed = custom.trim();
  const customParsed = customTrimmed === "" ? NaN : Number.parseFloat(customTrimmed);
  const customParseInvalid =
    selected === "custom" && (!Number.isFinite(customParsed) || customTrimmed === "");

  const amount = selected === "custom" ? (customParseInvalid ? NaN : customParsed) : current.value;

  const numericOk = Number.isFinite(amount) && amount > 0;
  const isFullPayoff =
    fullBorrow > 0 &&
    Number.isFinite(amount) &&
    Math.abs(amount - fullBorrow) <= Math.max(fullBorrow * 1e-9, 1e-9);
  const meetsMinRepay = isFullPayoff || (Number.isFinite(amount) && amount >= MIN_REPAY_AMOUNT);
  const exceedsBorrow =
    fullBorrow > 0 &&
    Number.isFinite(amount) &&
    amount > fullBorrow + Math.max(1e-9, fullBorrow * 1e-9);

  const paymentAmountValid = !customParseInvalid && numericOk && meetsMinRepay && !exceedsBorrow;

  const NETWORK_FEE = 0.05;
  const required = amount + NETWORK_FEE;
  const { isConnected, formatted: usdcBalance, isLoading, isError, refetch } = useUsdcBalance();
  const hasEnough = isConnected && usdcBalance >= required;
  const shortfall = Math.max(0, required - usdcBalance);
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });

  useEffect(() => {
    const handleReturn = () => {
      if (!awaitingReturnRef.current) return;
      if (document.visibilityState !== "visible") return;
      awaitingReturnRef.current = false;
      setPendingRecheck(true);
      window.setTimeout(() => {
        refetch();
        window.setTimeout(() => setPendingRecheck(false), 1500);
      }, 800);
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

  const fullOption = options.find((o) => o.id === "full")!;
  const interestOption = options.find((o) => o.id === "interest");
  const minimumOption = options.find((o) => o.id === "minimum");

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
                : "border-border bg-secondary/20 hover:border-border/80 hover:bg-secondary/40",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  selected === opt.id ? "border-primary" : "border-muted-foreground/40",
                )}
              >
                {selected === opt.id && <div className="h-2 w-2 rounded-full bg-gradient-to-br from-primary to-accent" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.desc}</div>
              </div>
              <div className="text-sm font-mono text-muted-foreground">
                {opt.id === "custom" ? "—" : `${opt.value} ${repayAssetSymbol}`}
              </div>
            </div>
            {selected === "custom" && opt.id === "custom" && (
              <div className="mt-4 pl-8 animate-fade-in">
                <input
                  type="number"
                  min={MIN_REPAY_AMOUNT}
                  step="any"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/60"
                  placeholder={`${MIN_REPAY_AMOUNT}`}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Calculated amount</span>
          <span className="text-lg font-bold font-mono text-gradient">
            {amount} {repayAssetSymbol}
          </span>
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
            {pendingRecheck && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary">
                <Loader2 className="h-3 w-3 animate-spin" /> Rechecking
              </span>
            )}
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
                  : "border-destructive/30 bg-destructive/10 text-destructive",
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

            {!hasEnough && (() => {
              const candidates = [
                { id: "full" as Option, label: "Full Repayment", value: fullOption.value },
                ...(interestOption && interestOption.value >= MIN_REPAY_AMOUNT
                  ? [{ id: "interest" as Option, label: "Interest Only", value: interestOption.value }]
                  : []),
                ...(minimumOption
                  ? [{ id: "minimum" as Option, label: "Minimum payment", value: minimumOption.value }]
                  : []),
              ];
              const affordable = candidates
                .filter((c) => c.id !== selected && usdcBalance >= c.value + NETWORK_FEE)
                .sort((a, b) => b.value - a.value)[0];

              const maxCustom = Math.max(0, usdcBalance - NETWORK_FEE);
              const canCustom = maxCustom > 0 && selected !== "custom";

              if (!affordable && !canCustom) return null;

              return (
                <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="text-muted-foreground">
                      Your balance can't cover the selected amount. Try a smaller repayment:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {affordable && (
                        <button
                          onClick={() => setSelected(affordable.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          Switch to {affordable.label} ({fmt(affordable.value)} {repayAssetSymbol})
                        </button>
                      )}
                      {canCustom && (
                        <button
                          onClick={() => {
                            setSelected("custom");
                            setCustom(maxCustom.toFixed(2));
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-1 font-semibold hover:bg-secondary/60 transition-colors"
                        >
                          Use max affordable ({fmt(maxCustom)} {repayAssetSymbol})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {!paymentAmountValid && (
        <p className="mt-4 text-xs text-destructive">
          {exceedsBorrow
            ? `Amount can't exceed your borrow balance of ${fmt(fullBorrow)} ${repayAssetSymbol}.`
            : customParseInvalid
              ? "Enter a valid repayment amount."
              : !numericOk
                ? "Enter a positive repayment amount."
                : `Minimum repayment is ${MIN_REPAY_AMOUNT} ${repayAssetSymbol} unless you pay the full ${fmt(fullBorrow)} ${repayAssetSymbol} balance.`}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </GlowButton>
        <GlowButton onClick={() => onNext(amount)} disabled={!paymentAmountValid}>
          Continue <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>

      <TopUpRouteModal
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        shortfall={shortfall}
        onRouteOpened={handleRouteOpened}
      />
    </div>
  );
};
