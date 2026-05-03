import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, Activity, Loader2, AlertCircle } from "lucide-react";
import { GlowButton } from "../GlowButton";
import type { WalletAddressKind } from "@/lib/walletAddress";
import { fetchDorkfiAlgorandBorrowPosition, type DorkfiResolvedPosition } from "@/lib/dorkfiApi";
import { formatTokenAmount } from "@/lib/formatToken";
import { DORKFI_ALGORAND_NETWORK } from "@/lib/dorkfiMarkets";

interface Props {
  address: string;
  addressKind: WalletAddressKind;
  onNext: () => void;
  onBack: () => void;
}

const Row = ({ label, value, mono = false, accent = false }: { label: string; value: string; mono?: boolean; accent?: boolean }) => (
  <div className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold ${mono ? "font-mono" : ""} ${accent ? "text-gradient" : ""}`}>{value}</span>
  </div>
);

function healthStatus(hf: number | null): { label: string; className: string } {
  if (hf === null || Number.isNaN(hf)) return { label: "—", className: "bg-muted/20 text-muted-foreground border-border/40" };
  if (hf >= 1.5) return { label: "Healthy", className: "bg-success/10 text-success border-success/20" };
  if (hf >= 1.05) return { label: "Watch", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
  if (hf >= 1) return { label: "At risk", className: "bg-destructive/10 text-destructive border-destructive/25" };
  return { label: "Liquidatable", className: "bg-destructive/15 text-destructive border-destructive/30" };
}

function formatHealthFactor(hf: number | null): string {
  if (hf === null || Number.isNaN(hf)) return "—";
  if (hf > 1e6) return "∞";
  return hf.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const Step2Position = ({ address, addressKind, onNext, onBack }: Props) => {
  const [loading, setLoading] = useState(addressKind === "algorand");
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<DorkfiResolvedPosition | null>(null);

  useEffect(() => {
    if (addressKind !== "algorand") {
      setLoading(false);
      setPosition(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPosition(null);
    fetchDorkfiAlgorandBorrowPosition(address)
      .then((p) => {
        if (cancelled) return;
        setPosition(p);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Could not reach DorkFi. Check your connection and try again.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address, addressKind]);

  if (addressKind === "evm") {
    return (
      <div className="glass-card p-8 md:p-10 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No position found</h3>
            <p className="text-sm text-muted-foreground">
              On-chain borrow detection is wired for <span className="text-foreground/90">Algorand · DorkFi</span> only. EVM
              addresses are accepted for future flows.
            </p>
          </div>
        </div>

        {/*
          TODO(coder): When LendPay should resolve Base (or other EVM) borrows, fetch lending protocol
          user positions for `address` here and branch the UI — same card layout as the Algorand path.
        */}

        <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-5 text-sm text-muted-foreground">
          <p className="font-mono text-xs break-all text-foreground/80 mb-2">{address}</p>
          <p>No borrow position lookup runs for EVM wallets yet.</p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <GlowButton variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Back
          </GlowButton>
          <GlowButton onClick={onNext}>
            Continue <ArrowRight className="h-4 w-4" />
          </GlowButton>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-8 md:p-10 animate-fade-in-up flex flex-col items-center justify-center gap-4 min-h-[280px]">
        <Loader2 className="h-10 w-10 animate-spin text-accent" aria-hidden />
        <p className="text-sm text-muted-foreground text-center">Fetching DorkFi position from indexer…</p>
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </GlowButton>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 md:p-10 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold">Could not load position</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <GlowButton variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Back
          </GlowButton>
          <GlowButton
            onClick={() => {
              setError(null);
              setPosition(null);
              setLoading(true);
              fetchDorkfiAlgorandBorrowPosition(address)
                .then(setPosition)
                .catch(() => setError("Could not reach DorkFi. Check your connection and try again."))
                .finally(() => setLoading(false));
            }}
          >
            Retry
          </GlowButton>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="glass-card p-8 md:p-10 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-center">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No position found</h3>
            <p className="text-sm text-muted-foreground">
              No repayable DorkFi USDC borrow was found for this address in the pools we scan (or the wallet is not in the indexer
              yet).
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-5 text-xs font-mono break-all text-muted-foreground">
          {address}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <GlowButton variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Back
          </GlowButton>
          <GlowButton onClick={onNext}>
            Continue <ArrowRight className="h-4 w-4" />
          </GlowButton>
        </div>
      </div>
    );
  }

  const { market, health, borrowUnderlying } = position;
  const debtStr = `${formatTokenAmount(borrowUnderlying, market.decimals)} ${market.symbol}`;
  const hf = health && typeof health.healthFactor === "number" ? health.healthFactor : null;
  const badge = healthStatus(hf);

  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Activity className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Position detected</h3>
          <p className="text-sm text-muted-foreground">Active DorkFi borrow on Algorand ({market.symbol}).</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-secondary/30 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
              D
            </div>
            <div>
              <div className="text-sm font-semibold">DorkFi</div>
              <div className="text-xs text-muted-foreground">
                {DORKFI_ALGORAND_NETWORK} · pool {market.poolAppId}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider border font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        <Row label="Chain" value="Algorand" />
        <Row label="Protocol" value="DorkFi" />
        <Row label="Market" value={`${market.name} (${market.symbol})`} />
        <Row label="Borrow balance" value={debtStr} mono accent />
        <Row label="Health factor" value={formatHealthFactor(hf)} mono />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </GlowButton>
        <GlowButton onClick={onNext}>
          Continue <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>
    </div>
  );
};
