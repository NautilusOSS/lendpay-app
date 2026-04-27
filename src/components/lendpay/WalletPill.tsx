import { useState } from "react";
import { Wallet, LogOut, Copy, Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBaseWallet } from "@/hooks/useBaseWallet";
import { cn } from "@/lib/utils";

export const WalletPill = () => {
  const { wallet, openConnectModal, disconnect } = useBaseWallet();
  const [popOpen, setPopOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (!wallet) {
    return (
      <button
        onClick={openConnectModal}
        className={cn(
          "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full",
          "bg-primary/10 border border-primary/40 text-primary text-xs font-semibold",
          "hover:bg-primary/20 hover:border-primary/70 hover:shadow-[0_0_18px_hsl(var(--primary)/0.35)]",
          "transition-all duration-300",
        )}
      >
        <Wallet className="h-3.5 w-3.5" />
        Connect wallet
      </button>
    );
  }

  const short = `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`;

  return (
    <Popover open={popOpen} onOpenChange={setPopOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
            "bg-card/60 backdrop-blur-md border border-border/60 text-xs font-medium",
            "hover:border-primary/50 transition-all duration-200",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="font-mono text-foreground">{short}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0 glass-card border-border/60">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {wallet.name} · Base
          </div>
          <div className="mt-2 text-xs font-mono break-all text-foreground/90">{wallet.address}</div>
        </div>
        <div className="p-2 flex flex-col">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-secondary/60 transition-colors text-left"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy address"}
          </button>
          <button
            onClick={() => {
              disconnect();
              setPopOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
          >
            <LogOut className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
