import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine",
  {
    variants: {
      variant: {
        default: "bg-terracotta text-cream shadow-sm hover:bg-[#b34e1f]",
        honey: "bg-honey text-ink hover:bg-comb",
        outline: "border border-ink/15 bg-white/70 text-ink hover:bg-white",
        ghost: "text-ink/80 hover:bg-ink/5",
        hive: "border-2 border-pine/20 bg-paper text-ink hover:border-pine/40",
      },
      size: {
        default: "h-12 px-5 text-base",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-6 text-lg",
        icon: "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
