import { LendPayLogo } from "./Logo";
import { WalletPill } from "./WalletPill";

export const Header = () => {
  return (
    <header className="w-full pt-8 pb-12 px-6 animate-fade-in">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Soft brand glow behind the mark */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-brand-violet blur-xl opacity-50" />
            <div className="relative h-11 w-11 rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md flex items-center justify-center">
              <LendPayLogo className="h-7 w-7" />
            </div>
          </div>
          <div className="leading-tight">
            <h1 className="text-xl font-bold tracking-tight">
              Lend<span className="text-gradient">Pay</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Repay loans on any chain with USDC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <WalletPill />
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-12 text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
          Repay DeFi loans on <span className="text-gradient">any chain</span> with USDC
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          One simple workflow. Pay USDC on Base — KeeperHub agents handle execution
          on the destination chain. No wallet needed there.
        </p>
      </div>
    </header>
  );
};
