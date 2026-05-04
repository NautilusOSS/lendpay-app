import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LendPayLogo } from "@/components/lendpay/Logo";
import { WalletPill } from "@/components/lendpay/WalletPill";
import { BetaIntakeForm } from "@/components/lendpay/BetaIntakeForm";

/**
 * Standalone intake URL — same form as the landing page, with optional dev endpoint details.
 */
const Intake = () => {
  return (
    <main className="min-h-screen w-full px-6 pb-20">
      <header className="max-w-3xl mx-auto pt-8 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-card/80 border border-border/60 flex items-center justify-center">
            <LendPayLogo className="h-5 w-5" />
          </div>
          <WalletPill />
        </div>
      </header>

      <div className="max-w-xl mx-auto mt-10">
        <BetaIntakeForm
          title="Program intake"
          description="Submit your details. A small nonrefundable signup fee of $1.00 USDC on Base (x402) completes when payment succeeds."
          showTechnicalDetails
        />
      </div>
    </main>
  );
};

export default Intake;
