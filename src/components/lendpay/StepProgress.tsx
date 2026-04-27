import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProgressProps {
  steps: string[];
  current: number;
}

export const StepProgress = ({ steps, current }: StepProgressProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 mb-8">
      <div className="flex items-center">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300",
                    done && "bg-gradient-to-br from-primary to-accent border-transparent text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)]",
                    active && "border-primary bg-primary/10 text-primary animate-pulse-glow",
                    !done && !active && "border-border bg-card/40 text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider hidden sm:block whitespace-nowrap",
                    active ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px mx-2 relative -mt-5">
                  <div className="absolute inset-0 bg-border" />
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-r from-primary to-accent transition-all duration-500",
                      done ? "opacity-100" : "opacity-0"
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
