import { useEffect } from "react";
import { toast } from "sonner";
import { BadgeCheck, Sparkles, Wallet } from "lucide-react";
import { MarketingNav } from "@/components/lendpay/MarketingNav";
import { BetaIntakeForm } from "@/components/lendpay/BetaIntakeForm";
import { GlowButton } from "@/components/lendpay/GlowButton";
import { checkSiteVersion } from "@/lib/versionCheck";

const ICON_VERSION = "2026-04-27";
const ICON_NOTICE_KEY = `lendpay:icon-notice:${ICON_VERSION}`;

const Index = () => {
  useEffect(() => {
    checkSiteVersion();
    try {
      if (localStorage.getItem(ICON_NOTICE_KEY)) return;
    } catch {
      /* ignore */
    }

    const t = window.setTimeout(() => {
      toast("LendPay icons updated", {
        description:
          "Your favicon and home-screen icons may take a moment to refresh. If you still see the old mark, hard-reload the page.",
        duration: 9000,
        action: {
          label: "Hard reload",
          onClick: () => window.location.reload(),
        },
      });
      try {
        localStorage.setItem(ICON_NOTICE_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 800);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen w-full">
      <MarketingNav />

      <section className="px-6 pt-12 pb-16 md:pt-20 md:pb-24 max-w-5xl mx-auto text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-primary/80 mb-4">Cross-chain DeFi · USDC on Base</p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
          Pay on Base. Execute on <span className="text-gradient">Any Chain</span>.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          LendPay is in <span className="text-foreground font-medium">private beta</span>. Join the waitlist with your
          details and a small nonrefundable signup fee (USDC on Base) — settled with x402.
        </p>
        <div className="mt-10 flex justify-center">
          <GlowButton
            className="w-full sm:w-auto"
            onClick={() =>
              document.getElementById("beta-signup")?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            Request beta access
          </GlowButton>
        </div>
      </section>

      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="glass-card p-6 text-left">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">One payment wallet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Fund USDC on Base. We coordinate execution on chains like Algorand — no extra wallet on the destination
              required for many flows.
            </p>
          </div>
          <div className="glass-card p-6 text-left">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <BadgeCheck className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Human + on-chain proof</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We collect your email and social handles for follow-up, and the USDC fee on Base proves this is a real
              signup—not a bot.
            </p>
          </div>
          <div className="glass-card p-6 text-left">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Early access</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Share how to reach you and confirm with a small nonrefundable signup fee in USDC so we can prioritize
              serious beta partners.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 max-w-xl mx-auto scroll-mt-24">
        <BetaIntakeForm
          id="beta-signup"
          title="Request beta access"
          description="Tell us who you are and how to reach you. Completing payment confirms your spot in the queue."
        />
      </section>

      <footer className="px-6 py-12 border-t border-border/50 text-center text-xs text-muted-foreground space-y-2">
        <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em]">
          <span className="text-brand-blue">Pay on Base</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-brand-mint">Execute on Any Chain</span>
        </div>
        <p className="text-muted-foreground/70">Signup fee paid on Base with x402 (USDC).</p>
      </footer>
    </main>
  );
};

export default Index;
