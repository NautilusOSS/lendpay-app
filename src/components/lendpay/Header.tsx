import { Zap } from "lucide-react";

export const Header = () => {
  return (
    <header className="w-full pt-8 pb-12 px-6 animate-fade-in">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent blur-lg opacity-60" />
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">LendPay</h1>
            <p className="text-xs text-muted-foreground tracking-wide">Cross-chain repayments</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-md border border-border/60">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Network active</span>
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-10 text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
          Repay Loans on <span className="text-gradient">Any Chain</span> with USDC
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Settle DeFi positions across networks in one flow. Pay with USDC on Base — we handle execution everywhere else.
        </p>
      </div>
    </header>
  );
};
