import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    if (variant === "ghost") {
      return (
        <button
          ref={ref}
          className={cn(
            "px-6 py-3 rounded-xl text-sm font-medium border border-border bg-card/40 text-foreground",
            "hover:bg-card/80 hover:border-border transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        >
          {children}
        </button>
      );
    }
    return (
      <button
        ref={ref}
        className={cn(
          "group relative px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground overflow-hidden",
          "bg-gradient-to-r from-primary to-accent",
          "shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_35px_hsl(var(--primary)/0.7)]",
          "transition-all duration-300 hover:-translate-y-0.5",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
          className
        )}
        {...props}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative flex items-center justify-center gap-2">{children}</span>
      </button>
    );
  }
);
GlowButton.displayName = "GlowButton";
