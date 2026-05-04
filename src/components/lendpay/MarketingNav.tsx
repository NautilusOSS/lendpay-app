import { Link } from "react-router-dom";
import { LendPayLogo } from "@/components/lendpay/Logo";
import { WalletPill } from "@/components/lendpay/WalletPill";

export function MarketingNav() {
  return (
    <header className="w-full pt-8 pb-6 px-6 animate-fade-in border-b border-border/40 bg-background/40 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 min-w-0 group">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-brand-violet blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="relative h-11 w-11 rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md flex items-center justify-center">
              <LendPayLogo className="h-7 w-7" />
            </div>
          </div>
          <div className="leading-tight min-w-0">
            <span className="text-xl font-bold tracking-tight block">
              Lend<span className="text-gradient">Pay</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground block truncate">
              Private beta
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <a
            href="#beta-signup"
            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider sm:normal-case sm:tracking-normal"
          >
            Sign up
          </a>
          <WalletPill />
        </nav>
      </div>
    </header>
  );
}
