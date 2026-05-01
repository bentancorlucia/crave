import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <h1
      className={cn(
        "font-script text-4xl leading-none text-crave-brown tracking-tight",
        className,
      )}
    >
      crave.
    </h1>
  );
}
