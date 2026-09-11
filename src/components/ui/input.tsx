import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-ink/12 bg-white/80 px-4 text-base text-ink shadow-sm outline-none placeholder:text-ink/35 focus:border-pine/40 focus:ring-2 focus:ring-honey/70",
        className,
      )}
      {...props}
    />
  );
}
