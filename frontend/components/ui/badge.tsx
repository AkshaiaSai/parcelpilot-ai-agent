import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border font-mono text-[10px] uppercase tracking-wider font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-border bg-secondary text-secondary-foreground",
        outline:
          "border-border bg-transparent text-muted-foreground",
        pine:
          "border-accent/30 bg-accent/10 text-accent",
        saffron:
          "border-warning-border bg-warning-bg text-warning",
        crimson:
          "border-destructive/30 bg-destructive/10 text-destructive",
        forest:
          "border-success-border bg-success-bg text-success",
        slate:
          "border-info-border bg-info-bg text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
