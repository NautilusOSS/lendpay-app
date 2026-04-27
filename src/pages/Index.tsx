import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/lendpay/Header";
import { StepProgress } from "@/components/lendpay/StepProgress";
import { Step1Address } from "@/components/lendpay/steps/Step1Address";
import { Step2Position } from "@/components/lendpay/steps/Step2Position";
import { Step3Repayment } from "@/components/lendpay/steps/Step3Repayment";
import { Step4Connect } from "@/components/lendpay/steps/Step4Connect";
import { Step5Confirm } from "@/components/lendpay/steps/Step5Confirm";
import { Step5Pack } from "@/components/lendpay/steps/Step5Pack";
import { Step6Trace } from "@/components/lendpay/steps/Step6Trace";
import { checkSiteVersion } from "@/lib/versionCheck";
import type { Pack } from "@/lib/packs";

// Bump this when icons change. We notify the user once per icon version
// so they know to hard-reload if their browser is still showing the old mark.
const ICON_VERSION = "2026-04-27";
const ICON_NOTICE_KEY = `lendpay:icon-notice:${ICON_VERSION}`;

const STEPS = ["Address", "Position", "Amount", "Connect", "Pack", "Confirm", "Execute"];

const Index = () => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [, setAddress] = useState("");
  const [amount, setAmount] = useState(0.016465);
  // Selected USDC pack (carries id + amount into the pay/confirm step and
  // downstream x402 / KeeperHub workflow calls).
  const [pack, setPack] = useState<Pack | null>(null);

  // One-time notice (per ICON_VERSION) that the LendPay icons have refreshed.
  // Offers a hard-reload action for browsers still serving the cached copy.
  useEffect(() => {
    // Cache-bust check: prompts a hard reload if the deployed site
    // version differs from what this browser last saw.
    checkSiteVersion();
    try {
      if (localStorage.getItem(ICON_NOTICE_KEY)) return;
    } catch {
      // localStorage may be unavailable — still show the toast this session
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


  // Direction-aware navigation so the transition matches user intent:
  // forward → slide in from the right, backward → slide in from the left.
  const goTo = (next: number) => {
    setDirection(next >= step ? "forward" : "backward");
    setStep(next);
  };

  const reset = () => {
    setDirection("backward");
    setStep(0);
    setAddress("");
    setAmount(0.016465);
  };

  return (
    <main className="min-h-screen w-full">
      <Header />
      <section className="px-6 pb-20">
        <StepProgress steps={STEPS} current={step} />
        <div className="max-w-2xl mx-auto relative overflow-hidden">
          {/* Re-keyed wrapper triggers the directional animation each transition.
              `[&>*]:animate-none` cancels the static fade-in-up on step cards so
              only the pipeline animation plays. */}
          <div
            key={`${step}-${direction}`}
            className={
              direction === "forward"
                ? "animate-step-in-forward [&>*]:animate-none"
                : "animate-step-in-backward [&>*]:animate-none"
            }
          >
            {step === 0 && <Step1Address onNext={(a) => { setAddress(a); goTo(1); }} />}
            {step === 1 && <Step2Position onNext={() => goTo(2)} onBack={() => goTo(0)} />}
            {step === 2 && <Step3Repayment onNext={(a) => { setAmount(a); goTo(3); }} onBack={() => goTo(1)} />}
            {step === 3 && <Step4Connect onNext={() => goTo(4)} onBack={() => goTo(2)} />}
            {step === 4 && <Step5Confirm amount={amount} onNext={() => goTo(5)} onBack={() => goTo(3)} />}
            {step === 5 && <Step6Trace amount={amount} onReset={reset} />}
          </div>
        </div>

        <footer className="mt-16 text-center text-xs text-muted-foreground space-y-2">
          <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em]">
            <span className="text-brand-blue">Pay on Base</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-brand-mint">Execute on Algorand</span>
          </div>
          <p className="text-muted-foreground/70">
            Powered by{" "}
            <a
              href="https://keeperhub.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/90 font-medium hover:text-primary underline-offset-4 hover:underline transition-colors"
            >
              KeeperHub
            </a>
          </p>
        </footer>
      </section>
    </main>
  );
};

export default Index;
