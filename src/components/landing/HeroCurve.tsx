"use client";

import { motion } from "framer-motion";

export function HeroCurve() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      viewBox="0 0 1440 700"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hero-curve-line" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#DC2626" stopOpacity="0" />
          <stop offset="50%" stopColor="#DC2626" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#DC2626" stopOpacity="0.30" />
        </linearGradient>
        <linearGradient id="hero-curve-area" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#DC2626" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M 0,680 Q 400,620 720,500 T 1440,140 L 1440,700 L 0,700 Z"
        fill="url(#hero-curve-area)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1.4, ease: "easeOut" }}
      />
      <motion.path
        d="M 0,680 Q 400,620 720,500 T 1440,140"
        fill="none"
        stroke="url(#hero-curve-line)"
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { delay: 0.2, duration: 2.8, ease: [0.4, 0, 0.2, 1] },
          opacity: { delay: 0.2, duration: 0.4, ease: "easeOut" },
        }}
      />
    </svg>
  );
}
