"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { Wordmark } from "@/components/brand";

interface AuthModalCardProps {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}

export function AuthModalCard({
  titleId,
  onClose,
  children,
}: AuthModalCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const firstInput = card.querySelector<HTMLElement>(
      "input:not([type='hidden']), button:not([aria-label='Fechar'])",
    );
    firstInput?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusables = card.querySelectorAll<HTMLElement>(
        'input, button, a, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    card.addEventListener("keydown", handleKeyDown);
    return () => card.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex h-full w-full flex-col bg-[var(--bg)] px-6 pt-16 pb-10 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:h-auto sm:max-w-[440px] sm:rounded-2xl sm:px-9 sm:pt-10 sm:pb-9"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-dim transition-colors hover:bg-subtle hover:text-foreground"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="mb-7 flex flex-col items-start gap-1">
        <Wordmark size="md" />
      </div>

      {children}
    </motion.div>
  );
}
