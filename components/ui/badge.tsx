import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
  {
    variants: {
      tone: {
        pink: "bg-crave-pink text-crave-brown",
        blue: "bg-crave-blue text-crave-brown",
        cream: "bg-crave-cream border border-crave-brown/20 text-crave-brown",
        outline: "border border-crave-brown/25 text-crave-brown/80",
        muted: "bg-crave-brown/10 text-crave-brown",
      },
    },
    defaultVariants: { tone: "pink" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
