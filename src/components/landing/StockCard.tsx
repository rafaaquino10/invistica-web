"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { StockCardData, StockLogoVariant } from "@/types/stock";

interface StockCardProps {
  data: StockCardData;
  entranceDelay: number;
  floatDuration: number;
  floatDistance: number;
  positionClasses: string;
}

const logoVariantClasses: Record<StockLogoVariant, string> = {
  accent: "bg-accent text-white",
  dark: "bg-[var(--text)] text-white",
  outline: "bg-white text-[var(--text)] border border-[var(--text)]",
};

export function StockCard({
  data,
  entranceDelay,
  floatDuration,
  floatDistance,
  positionClasses,
}: StockCardProps) {
  return (
    <motion.div
      className={cn("absolute", positionClasses)}
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: entranceDelay,
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <motion.article
        className="w-[260px] rounded-[12px] border border-[var(--border)] bg-[var(--bg)] px-[18px] pt-[18px] pb-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.06)]"
        animate={{ y: [0, -floatDistance, 0] }}
        transition={{
          duration: floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: entranceDelay + 0.7,
        }}
      >
        <div className="mb-[14px] flex items-center justify-between border-b border-[var(--border)] pb-[10px]">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-[5px] text-[11px] font-bold",
                logoVariantClasses[data.logoVariant],
              )}
            >
              {data.logoLetter}
            </div>
            <div>
              <div className="text-sm font-bold leading-[1.2] tabular-nums text-foreground">
                {data.ticker}
              </div>
              <div className="text-xs font-medium leading-[1.2] tabular-nums text-muted">
                {data.price}
              </div>
            </div>
          </div>
          {data.tag && (
            <span className="text-[10px] font-bold tracking-[1px] text-accent">
              {data.tag}
            </span>
          )}
        </div>

        <div className="mb-[14px] flex items-end justify-between">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-dim">
              Invscore
            </div>
            <div
              className={cn(
                "text-[38px] font-bold leading-none tabular-nums",
                data.invscoreAccent ? "text-accent" : "text-foreground",
              )}
            >
              {data.invscore}
            </div>
          </div>
          <div className="relative mb-[10px] h-[3px] w-[56px] rounded-[1px] bg-[var(--border)]">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 rounded-[1px] bg-accent"
              style={{ width: `${data.invscore}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-6 gap-[6px]">
          {data.subScores.map((sub) => (
            <div
              key={sub.label}
              className="flex flex-col items-center gap-[3px]"
            >
              <span className="text-[9px] font-semibold tracking-[0.5px] text-dim">
                {sub.label}
              </span>
              <span
                className={cn(
                  "text-[11px] font-bold tabular-nums",
                  sub.high ? "text-accent" : "text-foreground",
                )}
              >
                {sub.value}
              </span>
            </div>
          ))}
        </div>
      </motion.article>
    </motion.div>
  );
}
