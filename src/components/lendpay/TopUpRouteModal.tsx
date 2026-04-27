import { ExternalLink, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

interface Route {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  buildUrl: (amount: number) => string;
}

const routes: Route[] = [
  {
    id: "uniswap",
    name: "Uniswap",
    tagline: "Swap any token → USDC on Base, amount prefilled.",
    badge: "DEX · Base",
    buildUrl: (amount) =>
      `https://app.uniswap.org/swap?chain=base&outputCurrency=${USDC_BASE}&exactField=output&exactAmount=${amount.toFixed(2)}`,
  },
  {
    id: "coinbase",
    name: "Coinbase",
    tagline: "Buy USDC with card or bank, then withdraw to Base.",
    badge: "CEX · Fiat onramp",
    buildUrl: () => "https://www.coinbase.com/price/usd-coin",
  },
  {
    id: "circle",
    name: "Circle Mint",
    tagline: "Mint native USDC directly via Circle.",
    badge: "Issuer",
    buildUrl: () => "https://www.circle.com/en/usdc/developers",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortfall: number;
}

export const TopUpRouteModal = ({ open, onOpenChange, shortfall }: Props) => {
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });

  const open_route = (route: Route) => {
    window.open(route.buildUrl(shortfall), "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a top-up route</DialogTitle>
          <DialogDescription>
            You're short by{" "}
            <span className="font-mono text-foreground font-semibold">
              {fmt(shortfall)} USDC
            </span>
            . Pick where to acquire USDC on Base — we'll open the selected
            provider with USDC pre-selected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {routes.map((route) => (
            <button
              key={route.id}
              onClick={() => open_route(route)}
              className={cn(
                "w-full text-left rounded-xl border border-border bg-secondary/30 p-4 transition-all duration-200",
                "hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_0_20px_hsl(var(--primary)/0.12)]",
                "focus:outline-none focus:ring-2 focus:ring-primary/40"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{route.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground rounded-full border border-border px-1.5 py-0.5">
                      {route.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {route.tagline}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Opens in a new tab. You'll return here to finish the repayment.
        </p>
      </DialogContent>
    </Dialog>
  );
};
