import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-crave-blue rounded-card border border-crave-brown/15 shadow-soft p-6",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 flex items-start justify-between gap-3", className)} {...p} />
);

export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn(
      "uppercase tracking-widest text-xs font-semibold text-crave-brown/70",
      className,
    )}
    {...p}
  />
);
