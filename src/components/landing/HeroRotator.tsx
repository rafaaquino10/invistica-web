"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const words = [
  "value investing",
  "dividendos consistentes",
  "quality at a reasonable price",
  "momentum fundamentalista",
];

export function HeroRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setIndex((i) => (i + 1) % words.length);
      }, 2600);
    }, 2400);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <span className="relative block min-h-[1.1em] text-accent">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
