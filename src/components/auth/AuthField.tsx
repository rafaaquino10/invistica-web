"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField({ label, id, className, ...props }, ref) {
    return (
      <label htmlFor={id} className="flex flex-col gap-[6px]">
        <span className="text-[13px] font-medium text-foreground">{label}</span>
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-11 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-[14px] text-[15px] text-foreground placeholder:text-faint transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-[rgb(220_38_38_/_0.12)]",
            className,
          )}
          {...props}
        />
      </label>
    );
  },
);
