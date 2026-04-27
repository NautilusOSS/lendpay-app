import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProgressProps {
  steps: string[];
  current: number;
}

export const StepProgress = ({ steps, current }: StepProgressProps) => {
  const total = steps.length;
  // Progress fill for the overall bar — grows as steps complete.
  const pct = total > 1 ? (current / (total - 1)) * 100 : 0;
  const activeLabel = steps[current];

  return (
    <div className="w-full max-w-3xl mx-auto px-6 mb-10">
      {/* Header row: counter + active step name */}
      <div className="flex items-end justify-between mb-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Step{" "}
          <span className="text-foreground font-semibold">{current + 1}</span>
          <span className="text-muted-foreground/60"> / {total}</span>
        </div>
        <div className="text-xs font-medium text-foreground/90">
          {activeLabel}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="relative h-1 rounded-full bg-border/60 overflow-hidden mb-6">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-blue via-brand-violet to-brand-mint shadow-[0_0_12px_hsl(var(--brand-blue)/0.6)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step nodes */}
      <div className="flex items-start">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 min-w-0">
                <div className="relative">
                  {/* Brand glow halo for completed + active steps */}
                  {(done || active) && (
                    <div
                      className={cn(
                        "absolute -inset-1 rounded-full blur-md transition-opacity duration-300",
                        done
                          ? "bg-gradient-to-br from-brand-blue to-brand-violet opacity-60"
                          : "bg-brand-blue opacity-50 animate-pulse",
                      )}
                    />
                  )}

                  <div
                    className={cn(
                      "relative h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300",
                      done &&
                        "bg-gradient-to-br from-brand-blue to-brand-violet border-transparent text-primary-foreground",
                      active &&
                        "border-brand-blue bg-card text-brand-blue ring-2 ring-brand-blue/30",
                      !done &&
                        !active &&
                        "border-border bg-card/50 text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </div>

                  {/* Inner pulsing dot for the active step */}
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-brand-blue animate-pulse" />
                  )}
                </div>

                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider hidden sm:block whitespace-nowrap transition-colors",
                    done && "text-foreground/70",
                    active && "text-foreground font-semibold",
                    !done && !active && "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div className="flex-1 h-px mx-2 mt-[18px] relative">
                  <div className="absolute inset-0 bg-border" />
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-r from-brand-blue to-brand-violet transition-opacity duration-500",
                      done ? "opacity-100" : "opacity-0",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
