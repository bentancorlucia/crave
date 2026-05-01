import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-11 rounded-full border border-crave-brown/20 bg-crave-cream px-5 text-[15px] text-crave-brown placeholder:text-crave-brown/40 focus:outline-none focus:ring-2 focus:ring-crave-pink focus:border-transparent transition",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full min-h-24 rounded-2xl border border-crave-brown/20 bg-crave-cream px-5 py-3 text-[15px] text-crave-brown placeholder:text-crave-brown/40 focus:outline-none focus:ring-2 focus:ring-crave-pink focus:border-transparent transition resize-none",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
