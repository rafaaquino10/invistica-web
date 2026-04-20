"use client";

import { cn } from "@/lib/utils";
import type { WordmarkProps, WordmarkSize, WordmarkVariant } from "@/types/brand";

const sizeClasses: Record<WordmarkSize, string> = {
  sm: "text-[18px] font-medium tracking-[-0.5px]",
  md: "text-[22px] font-medium tracking-[-0.6px]",
  lg: "text-[32px] font-bold tracking-[-1px]",
  xl: "text-[72px] font-bold tracking-[-2px]",
};

const accentClasses: Record<WordmarkSize, string> = {
  sm: "before:content-[''] before:absolute before:left-1/2 before:-translate-x-1/2 before:bg-accent before:rounded-[1px] before:w-[5px] before:h-[1.5px] before:top-[-4px]",
  md: "before:content-[''] before:absolute before:left-1/2 before:-translate-x-1/2 before:bg-accent before:rounded-[1px] before:w-[6px] before:h-[1.5px] before:top-[-5px]",
  lg: "before:content-[''] before:absolute before:left-1/2 before:-translate-x-1/2 before:bg-accent before:rounded-[1px] before:w-[9px] before:h-[2px] before:top-[-7px]",
  xl: "before:content-[''] before:absolute before:left-1/2 before:-translate-x-1/2 before:bg-accent before:rounded-[1px] before:w-[16px] before:h-[3px] before:top-[-10px]",
};

const variantClasses: Record<WordmarkVariant, string> = {
  light: "text-foreground",
  dark: "text-white",
};

export function Wordmark({
  size = "md",
  variant = "light",
  className,
}: WordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline leading-none gap-0 whitespace-nowrap select-none",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      aria-label="Invística"
    >
      <span className="italic">I</span>
      {"nv"}
      <span className={cn("relative inline-block", accentClasses[size])}>
        <span className="italic">&#x0131;</span>
      </span>
      {"stica"}
    </span>
  );
}
