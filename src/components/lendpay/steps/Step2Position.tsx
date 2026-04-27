import { ArrowRight, ArrowLeft, Activity } from "lucide-react";
import { GlowButton } from "../GlowButton";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const Row = ({ label, value, mono = false, accent = false }: { label: string; value: string; mono?: boolean; accent?: boolean }) => (
  <div className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold ${mono ? "font-mono" : ""} ${accent ? "text-gradient" : ""}`}>{value}</span>
  </div>
);

export const Step2Position = ({ onNext, onBack }: Props) => {
  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Activity className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Position detected</h3>
          <p className="text-sm text-muted-foreground">We found an active loan on Algorand.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-secondary/30 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">D</div>
            <div>
              <div className="text-sm font-semibold">DorkFi</div>
              <div className="text-xs text-muted-foreground">Algorand · WAD market</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider bg-success/10 text-success border border-success/20 font-semibold">
            Healthy
          </span>
        </div>

        <Row label="Chain" value="Algorand" />
        <Row label="Protocol" value="DorkFi" />
        <Row label="Market" value="WAD" />
        <Row label="Debt" value="610.016559 WAD" mono />
        <Row label="Accrued Interest" value="0.016465 WAD" mono accent />
        <Row label="Health Factor" value="1.82" mono />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </GlowButton>
        <GlowButton onClick={onNext}>
          Continue <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>
    </div>
  );
};
