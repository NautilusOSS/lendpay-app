import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Loader2, Wallet, ShieldCheck, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorCard } from "./ErrorCard";

type WalletId = "walletconnect" | "metamask" | "coinbase";

type Phase = "idle" | "awaiting" | "connecting" | "error";

interface WalletOption {
  id: WalletId;
  name: string;
  description: string;
  initials: string;
  gradient: string;
}

const WALLETS: WalletOption[] = [
  {
    id: "walletconnect",
    name: "WalletConnect",
    description: "Scan with any mobile wallet",
    initials: "WC",
    gradient: "from-[hsl(217,91%,60%)] to-[hsl(199,89%,55%)]",
  },
  {
    id: "metamask",
    name: "MetaMask",
    description: "Browser extension",
    initials: "MM",
    gradient: "from-[hsl(28,95%,55%)] to-[hsl(15,90%,55%)]",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Smart wallet on Base",
    initials: "CB",
    gradient: "from-[hsl(221,83%,55%)] to-[hsl(231,73%,45%)]",
  },
];

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: (info: { wallet: WalletId; address: string }) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

const APPROVAL_TIMEOUT_MS = 20_000;

// EIP-1193 / WalletConnect-style rejection reasons. We pick one to surface a
// specific, actionable message instead of a generic "declined" string.
type RejectionCode = 4001 | 4100 | 5000 | -32002;

interface RejectionReason {
  code: RejectionCode;
  title: string;
  message: string;
  hint: string;
}

const REJECTION_REASONS: RejectionReason[] = [
  {
    code: 4001,
    title: "Request rejected in wallet",
    message: "You declined the connection request.",
    hint: "Tap Connect again and approve the prompt in your wallet to continue.",
  },
  {
    code: 4100,
    title: "Account not authorized",
    message: "The selected account hasn't authorized LendPay yet.",
    hint: "Open your wallet, switch to the account you want to pay from, then retry.",
  },
  {
    code: -32002,
    title: "Request already pending",
    message: "A previous connection request is still open in your wallet.",
    hint: "Open your wallet, dismiss the pending request, then try again.",
  },
  {
    code: 5000,
    title: "Wrong network selected",
    message: "Your wallet isn't on Base. LendPay needs Base (chain 8453) for USDC payment.",
    hint: "Switch to Base in your wallet, then retry the connection.",
  },
];

export const ConnectWalletModal = ({ open, onOpenChange, onConnected, onStatusChange }: Props) => {
  const [selected, setSelected] = useState<WalletId | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<"declined" | "timeout" | null>(null);
  const [rejection, setRejection] = useState<RejectionReason | null>(null);

  // Notify parent of connection status so it can gate UI (e.g. Continue button)
  useEffect(() => {
    if (!onStatusChange) return;
    if (phase === "error") onStatusChange("error");
    else if (phase === "awaiting" || phase === "connecting") onStatusChange("connecting");
    else onStatusChange("idle");
  }, [phase, onStatusChange]);

  // Reset state whenever the modal closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setSelected(null);
        setPhase("idle");
        setError(null);
        setErrorKind(null);
        setRejection(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const startConnect = (id: WalletId) => {
    setSelected(id);
    setError(null);
    setErrorKind(null);
    setRejection(null);
    setPhase("awaiting");

    // Simulate the wallet handshake: awaiting approval -> connecting -> result
    const declined = Math.random() < 0.2; // 20% chance the mock user "declines"
    // ~15% chance the mock approval "hangs" past the timeout
    const willHang = !declined && Math.random() < 0.15;
    const approvalDelay = willHang ? APPROVAL_TIMEOUT_MS + 2_000 : 1_400;

    // Timeout watchdog — fires if approval doesn't arrive in time
    const timeoutId = window.setTimeout(() => {
      setPhase("error");
      setErrorKind("timeout");
      setRejection(null);
      setError(
        "We didn't receive a response from your wallet in time. Open your wallet app, check for a pending request, then try again.",
      );
    }, APPROVAL_TIMEOUT_MS);

    window.setTimeout(() => {
      // If the watchdog already fired, abort this handshake
      if (approvalDelay >= APPROVAL_TIMEOUT_MS) return;
      window.clearTimeout(timeoutId);

      if (declined) {
        // Pick a specific rejection reason so the user knows what to fix
        const reason = REJECTION_REASONS[Math.floor(Math.random() * REJECTION_REASONS.length)];
        setPhase("error");
        setErrorKind("declined");
        setRejection(reason);
        setError(reason.message);
        return;
      }
      setPhase("connecting");
      window.setTimeout(() => {
        const address = "0x84F2" + Math.random().toString(16).slice(2, 6).toUpperCase() + "...9e3A";
        onStatusChange?.("connected");
        onConnected({ wallet: id, address });
        onOpenChange(false);
      }, 900);
    }, approvalDelay);
  };

  const reset = () => {
    setPhase("idle");
    setError(null);
    setErrorKind(null);
    setRejection(null);
    setSelected(null);
  };

  const activeWallet = WALLETS.find((w) => w.id === selected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card border-border/60 p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" />
              Connect Base Wallet
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pay USDC on Base. Your destination chain stays untouched.
            </DialogDescription>
          </DialogHeader>
        </div>

        {phase === "idle" && (
          <div className="p-4 space-y-2">
            {WALLETS.map((w) => (
              <button
                key={w.id}
                onClick={() => startConnect(w.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-secondary/30",
                  "hover:border-primary/50 hover:bg-secondary/60 transition-all duration-200 group text-left",
                )}
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shadow-lg",
                    w.gradient,
                  )}
                >
                  {w.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{w.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{w.description}</div>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  Connect →
                </span>
              </button>
            ))}

            <div className="mt-3 flex items-start gap-2 px-2 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
              <span>LendPay never holds your funds. You'll approve every USDC transfer in your wallet.</span>
            </div>
          </div>
        )}

        {(phase === "awaiting" || phase === "connecting") && activeWallet && (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-primary/30 blur-2xl animate-pulse" />
              <div
                className={cn(
                  "relative h-16 w-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-base font-bold text-white shadow-xl",
                  activeWallet.gradient,
                )}
              >
                {activeWallet.initials}
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center">
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
              </div>
            </div>

            <div className="text-sm font-semibold">
              {phase === "awaiting" ? `Opening ${activeWallet.name}...` : "Finalizing connection..."}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 max-w-xs">
              {phase === "awaiting"
                ? "Approve the connection request in your wallet to continue."
                : "Verifying signature and account on Base."}
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
          </div>
        )}

        {phase === "error" && activeWallet && (
          <div className="p-6 flex flex-col items-center">
            <ErrorCard
              tone={errorKind === "timeout" ? "warning" : "destructive"}
              title={
                errorKind === "timeout"
                  ? "Wallet didn't respond"
                  : rejection?.title ?? "Connection declined"
              }
              message={error ?? ""}
              hint={errorKind === "declined" ? rejection?.hint : undefined}
              meta={
                errorKind === "declined" && rejection
                  ? `${activeWallet.name} · code ${rejection.code}`
                  : undefined
              }
              className="w-full"
            />

            <div className="mt-5 flex items-center gap-2 w-full">
              <button
                onClick={reset}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium border border-border bg-secondary/40 hover:bg-secondary/70 transition-colors"
              >
                Choose another wallet
              </button>
              <button
                onClick={() => startConnect(activeWallet.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          </div>
        )}

        {phase === "idle" && (
          <div className="px-6 pb-5 pt-1 text-[10px] text-muted-foreground/70 text-center">
            By connecting, you agree to LendPay's terms. <Check className="h-3 w-3 inline -mt-0.5 text-success" /> Audited routing
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
