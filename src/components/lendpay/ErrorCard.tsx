import { AlertCircle, Clock, ShieldAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared error presentation primitives for LendPay.
 *
 * - `ErrorCard`   → block-level error with icon, title, body, optional hint and meta.
 * - `ErrorInline` → single-line error (used for field-level validation).
 *
 * Both honor a `tone` so timeouts read as warnings and rejections as destructive,
 * but every variant uses the same border / background / typography hierarchy so
 * errors feel like one unified system.
 */

export type ErrorTone = "destructive" | "warning";

const TONE_STYLES: Record<
  ErrorTone,
  { surface: string; border: string; iconBg: string; iconColor: string; text: string; defaultIcon: LucideIcon }
> = {
  destructive: {
    surface: "bg-destructive/5",
    border: "border-destructive/30",
    iconBg: "bg-destructive/10 border-destructive/30",
    iconColor: "text-destructive",
    text: "text-destructive",
    defaultIcon: AlertCircle,
  },
  warning: {
    surface: "bg-warning/5",
    border: "border-warning/30",
    iconBg: "bg-warning/10 border-warning/30",
    iconColor: "text-warning",
    text: "text-warning",
    defaultIcon: Clock,
  },
};

interface ErrorCardProps {
  tone?: ErrorTone;
  title: string;
  message: string;
  hint?: string;
  meta?: string;
  icon?: LucideIcon;
  align?: "center" | "left";
  className?: string;
}

export const ErrorCard = ({
  tone = "destructive",
  title,
  message,
  hint,
  meta,
  icon,
  align = "center",
  className,
}: ErrorCardProps) => {
  const t = TONE_STYLES[tone];
  const Icon = icon ?? t.defaultIcon;
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "rounded-xl border p-5 flex flex-col gap-2.5",
        alignment,
        t.surface,
        t.border,
        className,
      )}
    >
      <div
        className={cn(
          "h-12 w-12 rounded-2xl border flex items-center justify-center",
          t.iconBg,
        )}
      >
        <Icon className={cn("h-6 w-6", t.iconColor)} />
      </div>

      <div className="text-sm font-semibold text-foreground">{title}</div>
      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">{message}</p>

      {hint && (
        <div
          className={cn(
            "mt-1 w-full rounded-lg border bg-card/40 px-3 py-2",
            "border-brand-blue/25",
            align === "center" ? "text-left" : "",
          )}
        >
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-brand-blue mt-0.5 shrink-0" />
            <p className="text-[11px] leading-relaxed text-foreground/80">
              <span className="font-medium text-foreground">How to fix: </span>
              {hint}
            </p>
          </div>
        </div>
      )}

      {meta && (
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
          {meta}
        </div>
      )}
    </div>
  );
};

interface ErrorInlineProps {
  tone?: ErrorTone;
  message: string;
  icon?: LucideIcon;
  className?: string;
}

export const ErrorInline = ({
  tone = "destructive",
  message,
  icon,
  className,
}: ErrorInlineProps) => {
  const t = TONE_STYLES[tone];
  const Icon = icon ?? t.defaultIcon;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
        t.surface,
        t.border,
        t.text,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
};
