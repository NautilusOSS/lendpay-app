import { useState } from "react";
import { Header } from "@/components/lendpay/Header";
import { StepProgress } from "@/components/lendpay/StepProgress";
import { Step1Address } from "@/components/lendpay/steps/Step1Address";
import { Step2Position } from "@/components/lendpay/steps/Step2Position";
import { Step3Repayment } from "@/components/lendpay/steps/Step3Repayment";
import { Step4Connect } from "@/components/lendpay/steps/Step4Connect";
import { Step5Confirm } from "@/components/lendpay/steps/Step5Confirm";
import { Step6Trace } from "@/components/lendpay/steps/Step6Trace";

const STEPS = ["Address", "Position", "Amount", "Connect", "Confirm", "Execute"];

const Index = () => {
  const [step, setStep] = useState(0);
  const [, setAddress] = useState("");
  const [amount, setAmount] = useState(0.016465);

  const reset = () => {
    setStep(0);
    setAddress("");
    setAmount(0.016465);
  };

  return (
    <main className="min-h-screen w-full">
      <Header />
      <section className="px-6 pb-20">
        <StepProgress steps={STEPS} current={step} />
        <div className="max-w-2xl mx-auto" key={step}>
          {step === 0 && <Step1Address onNext={(a) => { setAddress(a); setStep(1); }} />}
          {step === 1 && <Step2Position onNext={() => setStep(2)} onBack={() => setStep(0)} />}
          {step === 2 && <Step3Repayment onNext={(a) => { setAmount(a); setStep(3); }} onBack={() => setStep(1)} />}
          {step === 3 && <Step4Connect onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <Step5Confirm amount={amount} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
          {step === 5 && <Step6Trace amount={amount} onReset={reset} />}
        </div>

        <footer className="mt-16 text-center text-xs text-muted-foreground space-y-1.5">
          <p>Powered by x402 on Base · Executes on Algorand via DorkFi</p>
          <p className="text-muted-foreground/70">
            Powered by <span className="text-primary/90 font-medium">KeeperHub</span>
          </p>
        </footer>
      </section>
    </main>
  );
};

export default Index;
