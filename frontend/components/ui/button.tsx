import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-xs font-sans font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-editorial hover:bg-primary/90 font-mono text-[11px] uppercase tracking-wider font-semibold",
        editorial:
          "bg-accent text-accent-foreground shadow-editorial hover:bg-accent/90 font-mono text-[11px] uppercase tracking-wider font-semibold",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/70 font-mono text-[11px] uppercase tracking-wider",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-secondary hover:text-foreground",
        quiet:
          "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-[11px] uppercase tracking-wider font-semibold",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3.5 py-1.5",
        sm: "h-7 rounded-sm px-2.5 text-[11px]",
        lg: "h-10 rounded-sm px-5 text-xs",
        icon: "h-8 w-8 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
