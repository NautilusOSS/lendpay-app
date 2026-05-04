import { useCallback, useMemo, useState } from "react";
import { Check, ClipboardList } from "lucide-react";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";
import { GlowButton } from "@/components/lendpay/GlowButton";
import { khPublicWorkflowCallUrl, khWorkflowCallUrl } from "@/lib/keeperhubWorkflow";
import { createX402Fetch, formatX402ClientError, tryDecodePaymentFromResponse } from "@/lib/x402";

export const BETA_INTAKE_PRICE_LABEL = "$1.00";

export type IntakePayload = {
  email: string;
  baseAddress: string;
  algorandAddress: string;
  discord: string;
  telegram: string;
};

function isValidEmail(s: string): boolean {
  const v = s.trim();
  if (v.length < 5 || v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidBaseAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s.trim());
}

function isValidAlgorandAddress(s: string): boolean {
  return /^[A-Z2-7]{58}$/i.test(s.trim());
}

function intakeWorkflowSlug(): string {
  return (import.meta.env.VITE_KEEPERHUB_INTAKE_SLUG as string | undefined)?.trim() ?? "";
}

type Phase = "idle" | "submitting" | "done" | "err";

export type BetaIntakeFormProps = {
  id?: string;
  className?: string;
  title?: string;
  description?: string;
  /** Show slug config hint and endpoint URL (standalone intake page). */
  showTechnicalDetails?: boolean;
};

export function BetaIntakeForm({
  id,
  className,
  title = "Sign up for beta",
  description = `Complete the form and pay ${BETA_INTAKE_PRICE_LABEL} USDC on Base (x402) as a small nonrefundable signup fee. Your details are submitted when payment succeeds.`,
  showTechnicalDetails = false,
}: BetaIntakeFormProps) {
  const slug = useMemo(() => intakeWorkflowSlug(), []);
  const callUrl = useMemo(() => (slug ? khWorkflowCallUrl(slug) : ""), [slug]);
  const publicUrl = useMemo(() => (slug ? khPublicWorkflowCallUrl(slug) : ""), [slug]);

  const [email, setEmail] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [algorandAddress, setAlgorandAddress] = useState("");
  const [discord, setDiscord] = useState("");
  const [telegram, setTelegram] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const onBaseMainnet = isConnected && chainId === base.id;

  const fetchWithPay = useMemo(() => {
    if (!onBaseMainnet || !walletClient || !publicClient) return null;
    try {
      return createX402Fetch(walletClient, publicClient);
    } catch {
      return null;
    }
  }, [onBaseMainnet, walletClient, publicClient]);

  const prefillBase = useCallback(() => {
    const a = address?.trim();
    if (a && isValidBaseAddress(a)) setBaseAddress(a);
  }, [address]);

  const validate = useCallback((): IntakePayload | null => {
    if (!slug) {
      setFormError(
        "Set VITE_KEEPERHUB_INTAKE_SLUG to your configured intake slug (listed price 1.00 USDC on Base).",
      );
      return null;
    }
    const em = email.trim();
    const base = baseAddress.trim();
    const algo = algorandAddress.trim();
    const disc = discord.trim();
    const tel = telegram.trim();
    if (!isValidEmail(em)) {
      setFormError("Enter a valid email address.");
      return null;
    }
    if (!isValidBaseAddress(base)) {
      setFormError("Base address must be a 0x-prefixed 40-character hex EVM address.");
      return null;
    }
    if (!isValidAlgorandAddress(algo)) {
      setFormError("Algorand address must be 58 base32 characters.");
      return null;
    }
    if (!disc) {
      setFormError("Enter your Discord username or invite handle.");
      return null;
    }
    if (!tel) {
      setFormError("Enter your Telegram username or link.");
      return null;
    }
    setFormError(null);
    return { email: em, baseAddress: base, algorandAddress: algo, discord: disc, telegram: tel };
  }, [slug, email, baseAddress, algorandAddress, discord, telegram]);

  const submit = useCallback(async () => {
    const payload = validate();
    if (!payload) return;
    if (!fetchWithPay) {
      setErrMsg("Connect a wallet on Base mainnet to sign the USDC x402 payment.");
      setPhase("err");
      return;
    }
    setErrMsg(null);
    setResultText(null);
    setPhase("submitting");
    try {
      const res = await fetchWithPay(callUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      void tryDecodePaymentFromResponse(res);
      const text = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text) as Record<string, unknown>;
          if (typeof j.error === "string") msg = `${msg}: ${j.error}`;
          else if (typeof j.message === "string") msg = `${msg}: ${j.message}`;
        } catch {
          if (text) msg = `${msg}: ${text.slice(0, 400)}`;
        }
        setErrMsg(msg);
        setPhase("err");
        return;
      }
      setResultText(text);
      setPhase("done");
    } catch (e) {
      setErrMsg(formatX402ClientError(e));
      setPhase("err");
    }
  }, [validate, fetchWithPay, callUrl]);

  const inputClass =
    "mt-2 w-full bg-input/60 border border-border rounded-xl px-4 py-3.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-primary/60 focus:ring-primary/20 transition-all";

  return (
    <section id={id} className={className}>
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="glass-card p-8 md:p-10 mt-8 space-y-6">
        {!slug && (
          <p className="text-sm text-amber-600/90 dark:text-amber-400/90 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            Configure <span className="font-mono text-xs">VITE_KEEPERHUB_INTAKE_SLUG</span> with your intake slug
            (1.00 USDC on Base). The server must accept JSON fields: email, baseAddress, algorandAddress, discord,
            telegram.
          </p>
        )}

        {showTechnicalDetails && slug && import.meta.env.DEV && (
          <p className="text-xs text-muted-foreground font-mono break-all">POST (dev proxy): {callUrl}</p>
        )}
        {showTechnicalDetails && slug && !import.meta.env.DEV && (
          <p className="text-xs text-muted-foreground">
            Endpoint:{" "}
            <a className="font-mono text-primary/90 underline-offset-2 hover:underline" href={publicUrl}>
              {publicUrl}
            </a>
          </p>
        )}

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Base address (EVM)
            </label>
            {address && (
              <button
                type="button"
                onClick={prefillBase}
                className="text-[10px] uppercase tracking-wider text-primary hover:underline"
              >
                Use connected wallet
              </button>
            )}
          </div>
          <input
            value={baseAddress}
            onChange={(e) => setBaseAddress(e.target.value)}
            placeholder="0x…"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Algorand address
          </label>
          <input
            value={algorandAddress}
            onChange={(e) => setAlgorandAddress(e.target.value)}
            placeholder="58-character Algorand address"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Discord</label>
          <input
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
            placeholder="username or handle"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Telegram</label>
          <input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username or t.me link"
            className={inputClass}
          />
        </div>

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        {errMsg && <p className="text-sm text-destructive">{errMsg}</p>}

        {phase === "done" && resultText && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-primary">
              <Check className="h-4 w-4" /> You&apos;re on the list
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Thanks for joining the beta. We&apos;ll follow up on the channels you shared.
            </p>
            <pre className="mt-3 max-h-48 overflow-auto text-xs text-muted-foreground whitespace-pre-wrap break-all">
              {resultText}
            </pre>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Beta signup includes a small nonrefundable signup fee of{" "}
            <span className="text-foreground font-medium">{BETA_INTAKE_PRICE_LABEL} USDC</span> on Base (configured
            listing price must match).
          </p>
          <GlowButton
            onClick={() => void submit()}
            disabled={!fetchWithPay || !slug}
            loading={phase === "submitting"}
            className="shrink-0"
          >
            Pay {BETA_INTAKE_PRICE_LABEL} & join beta
          </GlowButton>
        </div>

        {!onBaseMainnet && isConnected && (
          <p className="text-xs text-amber-600/90 dark:text-amber-400/90">
            Switch your wallet to <strong>Base</strong> mainnet and hold a small USDC balance for x402.
          </p>
        )}
        {!isConnected && (
          <p className="text-xs text-muted-foreground">Connect a wallet (top right) to pay and complete signup.</p>
        )}
      </div>
    </section>
  );
}
