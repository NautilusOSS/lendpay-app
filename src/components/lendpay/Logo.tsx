import { cn } from "@/lib/utils";

/**
 * LendPay brand mark — an "L" merging into a "P" with a forward arrow,
 * rendered with the brand blue→violet gradient (3366FF → 7B5CFF).
 * Inline SVG so it stays crisp at any size and inherits theme tokens.
 */
export const LendPayLogo = ({ className }: { className?: string }) => {
  const gradId = "lendpay-mark-gradient";
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="LendPay"
      className={cn("block", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--brand-blue))" />
          <stop offset="100%" stopColor="hsl(var(--brand-violet))" />
        </linearGradient>
      </defs>

      {/* L stem */}
      <path
        d="M14 10 H22 V44 H38 V52 H14 Z"
        fill={`url(#${gradId})`}
      />

      {/* P bowl */}
      <path
        d="M30 10 H42 a12 12 0 0 1 0 24 H38 V26 H42 a4 4 0 0 0 0 -8 H38 V42 H30 Z"
        fill={`url(#${gradId})`}
      />

      {/* Forward arrow exiting the P */}
      <path
        d="M32 40 H48 L48 36 L58 44 L48 52 L48 48 H32 Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
};
