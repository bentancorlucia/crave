import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all btn-press disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-crave-pink text-crave-brown hover:bg-[#eb92a6] shadow-soft",
        secondary:
          "bg-crave-blue text-crave-brown hover:bg-[#a3cee2] border border-crave-brown/15",
        ghost:
          "bg-transparent text-crave-brown hover:bg-crave-brown/5",
        outline:
          "bg-transparent text-crave-brown border border-crave-brown/25 hover:bg-crave-brown/5",
        link: "bg-transparent text-crave-brown underline decoration-2 underline-offset-4 hover:text-crave-pink",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-full",
        md: "h-11 px-6 text-sm rounded-full",
        lg: "h-12 px-7 text-base rounded-full",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
