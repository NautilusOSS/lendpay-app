import { useCallback, useMemo, useState } from "react";
import { Check, Loader2, Circle, PartyPopper, RotateCcw, Zap } from "lucide-react";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";
import { GlowButton } from "../GlowButton";
import { cn } from "@/lib/utils";
import {
  DORKFI_REPAY_WORKFLOW_ID,
  executeGatewayWorkflowWithFetch,
  type DorkfiRepayTriggerData,
  type ExecuteRequestBody,
} from "@/lib/gateway-api";
import { createX402Fetch, formatX402ClientError, tryDecodePaymentFromResponse } from "@/lib/x402";

interface Props {
  amount: number;
  repayAssetSymbol: string;
  /** Borrow before this repayment (from step 2 snapshot). */
  preRepayBorrowBalance: number;
  /** Algorand borrower / benefactor from step 1. */
  benefactorAddress: string;
  /** From step 2 / demo: pool app id → `triggerData.poolId`. */
  poolAppId?: string;
  /** Market (inner) app id → `triggerData.marketAppId`. */
  marketAppId?: string;
  /** Borrow receipt ASA → `triggerData.assetId`. */
  nTokenId?: string;
  /** Underlying asset ASA (e.g. USDC) → `triggerData.underlyingAssetId`. */
  underlyingAssetId?: string;
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

function isValidBenefactorAddress(value: string): boolean {
  const v = value.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return true;
  return /^[A-Z2-7]{58}$/i.test(v);
}

function clampGatewayFeeUsd(raw: string | undefined): string {
  const n = Number.parseFloat((raw ?? "0.10").trim());
  if (!Number.isFinite(n)) return "0.10";
  const c = Math.min(1, Math.max(0.01, n));
  return c.toFixed(2);
}

type Phase = "ready" | "paying" | "done" | "err";

type GatewaySuccess = {
  executionId?: string;
  settlementTx?: string;
};

function parsePositiveAppId(raw: string | undefined): number | null {
  const s = raw?.trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n <= 0 || !Number.isSafeInteger(n)) return null;
  return n;
}

/** Maps DorkFi config: `contractId`→marketAppId, `poolId`→poolId, nToken→assetId, underlying→optional. */
function buildDorkfiRepayTriggerData(p: {
  poolAppId?: string;
  marketAppId?: string;
  nTokenId?: string;
  underlyingAssetId?: string;
}): DorkfiRepayTriggerData | null {
  const marketAppId = parsePositiveAppId(p.marketAppId);
  const poolId = parsePositiveAppId(p.poolAppId);
  const assetId = parsePositiveAppId(p.underlyingAssetId);
  if (marketAppId === null || poolId === null || assetId === null) return null;
  const underlyingAssetId = parsePositiveAppId(p.underlyingAssetId);
  const out: DorkfiRepayTriggerData = { marketAppId, assetId, poolId };
  if (underlyingAssetId !== null) out.underlyingAssetId = underlyingAssetId;
  return out;
}

function parseGatewaySuccess(text: string): GatewaySuccess {
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    const executionId = typeof j.executionId === "string" ? j.executionId : undefined;
    const settlement = j.settlement as Record<string, unknown> | undefined;
    const settlementTx =
      settlement && typeof settlement.transactionHash === "string"
        ? settlement.transactionHash
        : undefined;
    return { executionId, settlementTx };
  } catch {
    return {};
  }
}

export const Step6Trace = ({
  amount,
  repayAssetSymbol,
  preRepayBorrowBalance,
  benefactorAddress,
  poolAppId,
  marketAppId,
  nTokenId,
  underlyingAssetId,
  onReset,
}: Props) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const onBaseMainnet = isConnected && chainId === base.id;

  const [phase, setPhase] = useState<Phase>("ready");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<GatewaySuccess | null>(null);

  const fetchWithPay = useMemo(() => {
    if (!onBaseMainnet || !walletClient || !publicClient) return null;
    try {
      return createX402Fetch(walletClient, publicClient);
    } catch {
      return null;
    }
  }, [onBaseMainnet, walletClient, publicClient]);

  const gatewayFeeUsd = useMemo(
    () => clampGatewayFeeUsd(import.meta.env.VITE_GATEWAY_PAY_USD as string | undefined),
    [],
  );

  const bearerToken = useMemo(
    () => (import.meta.env.VITE_GATEWAY_API_TOKEN as string | undefined)?.trim() ?? "",
    [],
  );

  const runExecute = useCallback(async () => {
    setErrMsg(null);
    setSuccess(null);

    if (!fetchWithPay) {
      setErrMsg("Connect a wallet on Base mainnet to sign the USDC x402 payment.");
      setPhase("err");
      return;
    }

    const target = address?.trim();
    if (!target || !/^0x[a-fA-F0-9]{40}$/i.test(target)) {
      setErrMsg("Missing Base wallet address. Go back and connect your payment wallet.");
      setPhase("err");
      return;
    }

    const bf = benefactorAddress.trim();
    if (!isValidBenefactorAddress(bf)) {
      setErrMsg("Invalid benefactor address from step 1. Use an Algorand (58 chars) or 0x EVM address.");
      setPhase("err");
      return;
    }

    const triggerData = buildDorkfiRepayTriggerData({
      poolAppId,
      marketAppId,
      nTokenId,
      underlyingAssetId,
    });
    if (!triggerData) {
      setErrMsg(
        "Missing DorkFi market ids (pool / market / nToken). Go back through step 2 so the position or demo defaults load.",
      );
      setPhase("err");
      return;
    }

    const body: ExecuteRequestBody = {
      chain: "algorand",
      protocol: "dorkfi",
      action: "repay",
      targetAddress: target,
      benefactorAddress: bf,
      asset: repayAssetSymbol.trim() || "USDC",
      amount: gatewayFeeUsd,
      triggerData,
    };

    setPhase("paying");

    try {
      const res = await executeGatewayWorkflowWithFetch(fetchWithPay, {
        workflowId: DORKFI_REPAY_WORKFLOW_ID,
        body,
        bearerToken,
      });
      void tryDecodePaymentFromResponse(res);
      const text = await res.text();

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text) as Record<string, unknown>;
          if (typeof j.error === "string") msg = `${msg}: ${j.error}`;
          else if (typeof j.code === "string") msg = `${msg}: ${j.code}`;
        } catch {
          if (text) msg = `${msg}: ${text.slice(0, 400)}`;
        }
        setErrMsg(msg);
        setPhase("err");
        return;
      }

      setSuccess(parseGatewaySuccess(text));
      setPhase("done");
    } catch (e) {
      setErrMsg(formatX402ClientError(e));
      setPhase("err");
    }
  }, [
    fetchWithPay,
    address,
    benefactorAddress,
    repayAssetSymbol,
    gatewayFeeUsd,
    bearerToken,
    poolAppId,
    marketAppId,
    nTokenId,
    underlyingAssetId,
  ]);

  const done = phase === "done";
  const newDebt = Math.max(0, preRepayBorrowBalance - amount).toFixed(6);

  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Execution</h3>
        <p className="text-sm text-muted-foreground">
          Pay the gateway fee on Base (x402 USDC), then the workflow runs on KeeperHub for{" "}
          <span className="font-mono text-foreground/90">{DORKFI_REPAY_WORKFLOW_ID}</span>.
        </p>
      </div>

      {phase === "ready" && (
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-5 space-y-3 text-sm mb-6">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Repay (Algorand position)</span>
            <span className="font-mono font-semibold">
              {amount} {repayAssetSymbol}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Gateway fee (Base x402)</span>
            <span className="font-mono font-semibold">${gatewayFeeUsd} USDC</span>
          </div>
          {!fetchWithPay && (
            <p className="text-xs text-destructive">
              Connect a Base mainnet wallet (step 4) to enable payment signing.
            </p>
          )}
        </div>
      )}

      {phase === "paying" && (
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Awaiting wallet signature and gateway response…
        </div>
      )}

      {phase === "err" && errMsg && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
          {errMsg}
        </div>
      )}

      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
        <ul className="space-y-4">
          {traceSteps.map((label, i) => {
            const isDone = done;
            const isActive = phase === "paying" && i === 3;
            const isPending = !done && !(phase === "paying" && i === 3);
            return (
              <li key={i} className="relative flex items-center gap-4">
                <div
                  className={cn(
                    "relative z-10 h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                    isDone && "bg-gradient-to-br from-primary to-accent border-transparent shadow-[0_0_15px_hsl(var(--primary)/0.6)]",
                    isActive && "border-primary bg-primary/10",
                    isPending && "border-border bg-card",
                  )}
                >
                  {isDone && <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />}
                  {isActive && <Loader2 className="h-4 w-4 text-primary animate-spin-slow" />}
                  {isPending && !isActive && (
                    <Circle className="h-2 w-2 fill-muted-foreground/40 text-muted-foreground/40" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm transition-colors",
                    isDone && "text-foreground font-medium",
                    isActive && "text-foreground font-semibold",
                    isPending && !isActive && "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-primary animate-pulse">
                    In progress
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {phase === "ready" && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <GlowButton variant="ghost" onClick={onReset}>
            <RotateCcw className="h-4 w-4" /> Cancel
          </GlowButton>
          <GlowButton onClick={() => void runExecute()} disabled={!fetchWithPay} className="gap-2">
            <Zap className="h-4 w-4" /> Pay gateway & run {DORKFI_REPAY_WORKFLOW_ID}
          </GlowButton>
        </div>
      )}

      {phase === "err" && (
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <GlowButton variant="ghost" onClick={onReset}>
            <RotateCcw className="h-4 w-4" /> Start over
          </GlowButton>
          <GlowButton onClick={() => void runExecute()} disabled={!fetchWithPay}>
            Retry
          </GlowButton>
        </div>
      )}

      {done && (
        <div className="mt-8 rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-primary/5 p-6 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
              <PartyPopper className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-base font-bold">Repayment submitted</div>
              <div className="text-xs text-muted-foreground">Gateway settled on Base · KeeperHub execution started</div>
            </div>
          </div>
          {(success?.executionId || success?.settlementTx) && (
            <div className="mt-4 space-y-2 text-xs font-mono break-all">
              {success.executionId && (
                <div>
                  <span className="text-muted-foreground">executionId: </span>
                  {success.executionId}
                </div>
              )}
              {success.settlementTx && (
                <div>
                  <span className="text-muted-foreground">settlement tx: </span>
                  {success.settlementTx}
                </div>
              )}
            </div>
          )}
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-card/60 border border-border/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Repaid</div>
              <div className="mt-1 text-sm font-mono font-semibold">
                {amount} {repayAssetSymbol}
              </div>
            </div>
            <div className="rounded-lg bg-card/60 border border-border/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Est. remaining borrow</div>
              <div className="mt-1 text-sm font-mono font-semibold text-gradient">
                {newDebt} {repayAssetSymbol}
              </div>
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
