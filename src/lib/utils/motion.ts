// ─── Variantes de Animação Reutilizáveis ───────────────────────
// Micro-animações sutis para UX premium.
// Todas respeitam prefers-reduced-motion via framer-motion.

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
}

export const scaleIn = {
  hidden: { scale: 0.9, opacity: 0 },
  show: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 15 } },
}

export const tabTransition = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: { duration: 0.2 },
}

export function barGrowTransition(index: number) {
  return {
    initial: { width: 0 },
    animate: { width: '100%' },
    transition: { duration: 0.6, ease: 'easeOut' as const, delay: index * 0.1 },
  }
}
