import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-brand-blue to-brand-violet text-primary-foreground shadow-[0_0_18px_hsl(var(--brand-blue)/0.4)] hover:shadow-[0_0_30px_hsl(var(--brand-violet)/0.6)] hover:-translate-y-0.5 disabled:shadow-none disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:hover:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_18px_hsl(var(--destructive)/0.45)]",
        outline:
          "border border-brand-blue/40 bg-brand-blue/5 text-foreground hover:bg-brand-blue/15 hover:border-brand-blue/70 hover:text-foreground hover:shadow-[0_0_18px_hsl(var(--brand-blue)/0.3)]",
        secondary:
          "border border-brand-blue/30 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 hover:border-brand-blue/60 hover:shadow-[0_0_20px_hsl(var(--brand-blue)/0.35)]",
        ghost: "hover:bg-card/60 hover:text-foreground",
        link: "text-brand-blue underline-offset-4 hover:underline hover:text-brand-violet",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
