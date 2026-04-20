"use client";

import { cn } from "@/lib/utils";
import type { WordmarkProps, WordmarkSize, WordmarkVariant } from "@/types/brand";

const sizeClasses: Record<WordmarkSize, string> = {
  sm: "text-[18px] font-medium",
  md: "text-[22px] font-medium",
  lg: "text-[32px] font-bold",
  xl: "text-[72px] font-bold",
};

const accentClasses: Record<WordmarkSize, string> = {
  sm: "w-[5px] h-[1.5px] top-[-4px] left-[calc(50%+1px)]",
  md: "w-[6px] h-[1.5px] top-[-5px] left-[calc(50%+1px)]",
  lg: "w-[9px] h-[2px] top-[-7px] left-[calc(50%+2px)]",
  xl: "w-[16px] h-[3px] top-[-10px] left-[calc(50%+5px)]",
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
        "inline-flex items-baseline leading-none tracking-tight select-none",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      aria-label="Invística"
    >
      <span className="italic">I</span>
      <span>nv</span>
      <span className="relative inline-block">
        <span
          aria-hidden="true"
          className={cn(
            "absolute -translate-x-1/2 bg-accent rounded-[1px]",
            accentClasses[size],
          )}
        />
        <span className="italic">&#x0131;</span>
      </span>
      <span>stica</span>
    </span>
  );
}
