import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "block text-xs font-semibold uppercase tracking-wider text-crave-brown/70 mb-2 px-2",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";
