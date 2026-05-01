import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  initial: string;
  size?: "sm" | "md" | "lg";
  tone?: "blue" | "cream" | "pink";
}

const sizes = {
  sm: "h-6 w-6",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

const tones = {
  blue: "bg-crave-blue",
  cream: "bg-crave-cream border border-crave-brown/20",
  pink: "bg-crave-pink",
};

export function Avatar({ initial, size = "md", tone = "blue", className, ...rest }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full inline-block text-crave-brown shrink-0 select-none overflow-hidden",
        sizes[size],
        tones[tone],
        className,
      )}
      {...rest}
    >
      <svg viewBox="0 0 40 40" className="block w-full h-full" aria-hidden>
        <text
          x="20"
          y="20"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-fraunces), Georgia, serif"
          fontSize="22"
          fontWeight="500"
          fill="currentColor"
        >
          {initial}
        </text>
      </svg>
    </div>
  );
}
