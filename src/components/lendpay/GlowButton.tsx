import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary  → solid brand gradient (blue → violet) with glow
   * secondary → tonal brand surface with subtle glow on hover
   * ghost    → low-emphasis outlined
   */
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

const base =
  "group relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold " +
  "transition-all duration-300 ease-[var(--transition-smooth)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none";

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    { className, variant = "primary", children, loading, disabled, ...props },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    if (variant === "ghost") {
      return (
        <button
          ref={ref}
          disabled={isDisabled}
          className={cn(
            base,
            "border border-border bg-card/40 text-foreground font-medium",
            "hover:bg-card/80 hover:border-brand-blue/40 hover:text-foreground",
            className,
          )}
          {...props}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {children}
        </button>
      );
    }

    if (variant === "secondary") {
      return (
        <button
          ref={ref}
          disabled={isDisabled}
          className={cn(
            base,
            "border border-brand-blue/40 bg-brand-blue/10 text-brand-blue overflow-hidden",
            "hover:bg-brand-blue/20 hover:border-brand-blue/70 hover:shadow-[0_0_24px_hsl(var(--brand-blue)/0.35)]",
            "hover:-translate-y-0.5",
            className,
          )}
          {...props}
        >
          <span className="relative flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
          </span>
        </button>
      );
    }

    // primary
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          base,
          "text-primary-foreground overflow-hidden",
          "bg-gradient-to-r from-brand-blue to-brand-violet",
          "shadow-[0_0_20px_hsl(var(--brand-blue)/0.45)]",
          "hover:shadow-[0_0_38px_hsl(var(--brand-violet)/0.7)] hover:-translate-y-0.5",
          "active:translate-y-0 active:shadow-[0_0_16px_hsl(var(--brand-blue)/0.5)]",
          // Reverse-gradient hover wash
          "before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-brand-violet before:to-brand-blue before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
          // Disabled override — kill the brand glow when inactive
          "disabled:shadow-none disabled:bg-gradient-to-r disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:before:opacity-0",
          className,
        )}
        {...props}
      >
        <span className="relative flex items-center justify-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {children}
        </span>
      </button>
    );
  },
);

GlowButton.displayName = "GlowButton";
