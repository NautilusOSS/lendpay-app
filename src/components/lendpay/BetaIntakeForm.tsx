import { useCallback, useMemo, useState } from "react";
import { Check, ClipboardList } from "lucide-react";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";
import { GlowButton } from "@/components/lendpay/GlowButton";
import { WalletPill } from "@/components/lendpay/WalletPill";
import {
  gatewayPaidBetaSignupExecuteBaseDisplayUrl,
  gatewayPaidBetaSignupExecuteUrl,
  type PaidBetaSignupFields,
} from "@/lib/keeperhubWorkflow";
import { createX402Fetch, formatX402ClientError, tryDecodePaymentFromResponse } from "@/lib/x402";
import { cn } from "@/lib/utils";

/** Shown in UI copy; must match `amount` sent on the workflow execute URL (gateway listing). */
export const BETA_INTAKE_PRICE_LABEL = "$1.00";

const BETA_INTAKE_AMOUNT_QUERY = "1.00";

export type IntakePayload = PaidBetaSignupFields;

function isValidEmail(s: string): boolean {
  const v = s.trim();
  if (v.length < 5 || v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function paidBetaSignupWorkflowSlug(): string {
  const slug =
    (import.meta.env.VITE_KEEPERHUB_LENDPAY_PAID_BETA_SIGNUP_WORKFLOW_SLUG as string | undefined)?.trim() ||
    (import.meta.env.VITE_KEEPERHUB_LENDPAY_PAID_BETA_SIGNUP_WORKFLOW_ID as string | undefined)?.trim();
  return slug || "lendpay-paid-beta-signup";
}

function isValidBaseAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s.trim());
}

function isValidAlgorandAddress(s: string): boolean {
  return /^[A-Z2-7]{58}$/i.test(s.trim());
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
  description = `Complete the form and pay ${BETA_INTAKE_PRICE_LABEL} USDC on Base (x402) as a small nonrefundable signup fee. Your details are submitted when payment succeeds. Beta signup does not guarantee access.`,
  showTechnicalDetails = false,
}: BetaIntakeFormProps) {
  const slug = useMemo(() => paidBetaSignupWorkflowSlug(), []);
  const executeBaseDisplayUrl = useMemo(() => gatewayPaidBetaSignupExecuteBaseDisplayUrl(slug), [slug]);

  const [email, setEmail] = useState("");
  const [algorandAddress, setAlgorandAddress] = useState("");
  const [discord, setDiscord] = useState("");
  const [telegram, setTelegram] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

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

  const validate = useCallback((): IntakePayload | null => {
    const em = email.trim();
    if (!em) {
      setFormError("Email is required.");
      return null;
    }
    if (!isValidEmail(em)) {
      setFormError("Enter a valid email address.");
      return null;
    }

    const baseAddr = (address ?? "").trim();
    if (!isConnected || !baseAddr) {
      setFormError("Connect a wallet so your Base EVM address is included.");
      return null;
    }
    if (!isValidBaseAddress(baseAddr)) {
      setFormError("Connected wallet address is not a valid EVM address.");
      return null;
    }
    const algo = algorandAddress.trim();
    const disc = discord.trim();
    const tel = telegram.trim();
    if (!isValidBaseAddress(baseAddr)) {
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
    return {
      discord: disc,
      email: em,
      telegram: tel,
      baseAddress: baseAddr,
      algorandAddress: algo,
      amount: BETA_INTAKE_AMOUNT_QUERY,
    };
  }, [email, address, isConnected, algorandAddress, discord, telegram]);

  const submit = useCallback(async () => {
    const payload = validate();
    if (!payload) return;
    if (!fetchWithPay) {
      setErrMsg("Connect a wallet on Base mainnet to sign the USDC x402 payment.");
      setPhase("err");
      return;
    }
    const executeUrl = gatewayPaidBetaSignupExecuteUrl(slug, payload);
    setErrMsg(null);
    setPhase("submitting");
    try {
      const headers: Record<string, string> = {};
      const token = (import.meta.env.VITE_GATEWAY_API_TOKEN as string | undefined)?.trim();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetchWithPay(executeUrl, {
        method: "POST",
        headers,
      });
      void tryDecodePaymentFromResponse(res);
      const text = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text) as Record<string, unknown>;
          if (typeof j.error === "string") msg = `${msg}: ${j.error}`;
          else if (typeof j.message === "string") msg = `${msg}: ${j.message}`;
          if (j.code === "VALIDATION_ERROR" && j.details && typeof j.details === "object") {
            msg = `${msg} (${JSON.stringify(j.details)})`;
          }
        } catch {
          if (text) msg = `${msg}: ${text.slice(0, 400)}`;
        }
        setErrMsg(msg);
        setPhase("err");
        return;
      }
      setPhase("done");
    } catch (e) {
      setErrMsg(formatX402ClientError(e));
      setPhase("err");
    }
  }, [validate, fetchWithPay, slug]);

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
        {showTechnicalDetails && (
          <div className="text-xs text-muted-foreground space-y-1.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
            <p>
              Workflow slug <span className="font-mono text-foreground/90">{slug}</span> — override with{" "}
              <span className="font-mono">VITE_KEEPERHUB_LENDPAY_PAID_BETA_SIGNUP_WORKFLOW_SLUG</span> (or{" "}
              <span className="font-mono">…_WORKFLOW_ID</span>) if needed.
            </p>
            {import.meta.env.DEV ? (
              <p className="font-mono break-all">
                POST (dev): /gateway/workflows/{slug}/execute?algorandAddress=…&amount={BETA_INTAKE_AMOUNT_QUERY}&baseAddress=…&discord=…&email=…&telegram=…
                (sorted query; body ignored)
              </p>
            ) : (
              <p>
                Endpoint base:{" "}
                <a className="font-mono text-primary/90 underline-offset-2 hover:underline" href={executeBaseDisplayUrl}>
                  {executeBaseDisplayUrl}
                </a>
              </p>
            )}
          </div>
        )}

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email</label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Base address (EVM)
            </label>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <WalletPill />
            </div>
          </div>
          <input
            readOnly
            value={address ?? ""}
            placeholder="Connect wallet — your address appears here"
            className={cn(
              inputClass,
              "cursor-default bg-muted/25 text-foreground/90",
              !address && "text-muted-foreground",
            )}
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

        {phase === "done" && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-primary">
              <Check className="h-4 w-4" /> Application received
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Thanks for applying. Beta signup does not guarantee access — we&apos;ll only reach out on the channels you
              shared if there is a fit.
            </p>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Beta signup includes a nonrefundable fee of{" "}
            <span className="text-foreground font-medium">{BETA_INTAKE_PRICE_LABEL} USDC</span> on Base. Paying does not
            guarantee beta access.
          </p>
          <GlowButton
            onClick={() => void submit()}
            disabled={!fetchWithPay}
            loading={phase === "submitting"}
            className="shrink-0"
          >
            Pay {BETA_INTAKE_PRICE_LABEL} & submit
          </GlowButton>
        </div>

        {!onBaseMainnet && isConnected && (
          <p className="text-xs text-amber-600/90 dark:text-amber-400/90">
            Switch your wallet to <strong>Base</strong> mainnet and hold a small USDC balance for x402.
          </p>
        )}
        {!isConnected && (
          <p className="text-xs text-muted-foreground">Connect a wallet to pay and complete signup.</p>
        )}
      </div>
    </section>
  );
}
