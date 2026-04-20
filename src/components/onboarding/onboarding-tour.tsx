'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'investiq-onboarding-completed'

interface TourStep {
  /** CSS selector do elemento a destacar */
  target: string
  /** Titulo breve */
  title: string
  /** Descricao curta (1-2 linhas) */
  description: string
  /** Rota onde este step deve aparecer (null = qualquer) */
  route?: string
  /** Posicao preferida do tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * Steps do tour organizado por pagina.
 * Ao navegar para cada pagina do sidebar, os steps daquela pagina sao exibidos.
 */
const TOUR_STEPS: TourStep[] = [
  // Dashboard
  { target: '#kpi-strip, [class*="KpiStrip"]', title: 'Seus KPIs', description: 'Patrimonio, resultado e regime macro da sua carteira em tempo real.', route: '/dashboard', position: 'bottom' },
  { target: '[class*="SignalCard"], [class*="signal-card"]', title: 'Motor Estrategico', description: 'Sinais de compra/venda/hold gerados pelo motor Invscore com nivel de confianca.', route: '/dashboard', position: 'left' },
  { target: '[class*="RegimeStrip"], [class*="regime-strip"]', title: 'Regime Macro', description: 'SELIC, IPCA, cambio e Brent em linha unica. O regime macro guia a estrategia.', route: '/dashboard', position: 'bottom' },

  // Explorer
  { target: '[data-tour="explorer"], [role="tablist"]', title: 'Lens de Analise', description: 'Troque entre Geral, Valor, Dividendos, Crescimento, Defensiva e Momento. As colunas ajustam automaticamente.', route: '/explorer', position: 'bottom' },

  // Asset Detail
  { target: '[class*="ScoreGauge"]', title: 'Invscore', description: 'Score de 0 a 100 baseado em 6 pilares: Valuation, Qualidade, Risco, Dividendos, Crescimento e Qualitativo.', route: '/ativo', position: 'left' },

  // Estrategias
  { target: '[class*="TabButton"], [class*="tab-button"]', title: 'Estrategias IQ', description: 'Carteiras inteligentes, alocacao otima pelo motor e candidatos a short — tudo baseado no Invscore.', route: '/estrategias', position: 'bottom' },
]

/** Posicao e dimensoes de um elemento na tela */
interface Rect { top: number; left: number; width: number; height: number }

function getElementRect(selector: string): Rect | null {
  // Support comma-separated selectors (try each)
  const selectors = selector.split(',').map(s => s.trim())
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        return { top: rect.top + window.scrollY, left: rect.left, width: rect.width, height: rect.height }
      }
    }
  }
  return null
}

export function OnboardingTour() {
  const router = useRouter()
  const pathname = usePathname()
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Filter steps for current route
  const activeSteps = TOUR_STEPS.filter(s => !s.route || pathname.startsWith(s.route))

  // Auto-start on first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  // Update target rect when step changes
  const updateRect = useCallback(() => {
    if (!isActive || activeSteps.length === 0) return
    const step = activeSteps[currentStep]
    if (!step) return
    const rect = getElementRect(step.target)
    setTargetRect(rect)
    if (rect) {
      window.scrollTo({ top: Math.max(0, rect.top - 120), behavior: 'smooth' })
    }
  }, [isActive, currentStep, activeSteps])

  useEffect(() => {
    updateRect()
    const id = setInterval(updateRect, 2000) // recalc on layout shifts
    return () => clearInterval(id)
  }, [updateRect])

  // Reset step when route changes
  useEffect(() => {
    if (isActive) setCurrentStep(0)
  }, [pathname])

  const handleNext = () => {
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsActive(false)
    setCurrentStep(0)
  }

  if (!isActive || activeSteps.length === 0) return null

  const step = activeSteps[currentStep]
  if (!step) return null

  const pos = step.position ?? 'bottom'

  // Calculate tooltip position relative to target
  const tooltipStyle: React.CSSProperties = targetRect
    ? {
        position: 'absolute',
        ...(pos === 'bottom' && { top: targetRect.top + targetRect.height + 12, left: targetRect.left }),
        ...(pos === 'top' && { top: targetRect.top - 12, left: targetRect.left, transform: 'translateY(-100%)' }),
        ...(pos === 'left' && { top: targetRect.top, left: targetRect.left - 12, transform: 'translateX(-100%)' }),
        ...(pos === 'right' && { top: targetRect.top, left: targetRect.left + targetRect.width + 12 }),
        maxWidth: 320,
        zIndex: 110,
      }
    : {
        position: 'fixed',
        bottom: 80,
        right: 24,
        maxWidth: 320,
        zIndex: 110,
      }

  return (
    <>
      {/* Subtle overlay — semi-transparent, NOT blocking */}
      <div
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.15)' }}
      />

      {/* Spotlight cutout on target element */}
      {targetRect && (
        <div
          className="fixed z-[101] pointer-events-none rounded-[var(--radius)] ring-2 ring-[var(--accent-1)] ring-offset-2"
          style={{
            top: targetRect.top - window.scrollY,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.15)',
            background: 'transparent',
          }}
        />
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={tooltipRef}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="z-[110] pointer-events-auto"
          style={tooltipStyle as any}
        >
          <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-[var(--shadow-overlay)] p-4 max-w-[320px]">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-[var(--accent-1)] uppercase tracking-wider">
                {currentStep + 1}/{activeSteps.length}
              </span>
              <div className="flex gap-1 flex-1">
                {activeSteps.map((_, i) => (
                  <div key={i} className={cn('h-1 rounded-full flex-1', i <= currentStep ? 'bg-[var(--accent-1)]' : 'bg-[var(--border-1)]')} />
                ))}
              </div>
            </div>

            {/* Content */}
            <h3 className="text-[var(--text-small)] font-bold text-[var(--text-1)] mb-1">{step.title}</h3>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] leading-relaxed mb-3">{step.description}</p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleComplete}
                className="text-[var(--text-caption)] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
              >
                Pular tour
              </button>
              <button
                onClick={handleNext}
                className="px-3 py-1.5 rounded-md text-[var(--text-caption)] font-semibold bg-[var(--accent-1)] text-white hover:bg-[var(--accent-1)]/90 transition-colors"
              >
                {currentStep === activeSteps.length - 1 ? 'Entendi' : 'Proximo'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
