'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { InvestorProfileQuiz } from './investor-profile-quiz'

const STORAGE_KEY = 'aqinvest-onboarding-completed'

interface Step {
  title: string
  description: string
  icon: React.ReactNode
  target?: string    // CSS selector para spotlight
  action?: { label: string; href: string }
}

const steps: Step[] = [
  {
    title: 'Bem-vindo ao aQ Invest',
    description:
      'Sua plataforma de análise fundamentalista inteligente. Avaliamos ações brasileiras de 0 a 100 com base em 6 pilares: Valuation, Qualidade, Risco, Dividendos, Crescimento e Qualitativo.',
    icon: (
      <div className="w-16 h-16 rounded-[var(--radius)] border border-[var(--border-1)] flex items-center justify-center">
        <span className="text-[var(--text-1)] font-bold text-[var(--text-display)]">aQ</span>
      </div>
    ),
  },
  {
    title: 'Seus KPIs',
    description:
      'Patrimônio, rentabilidade e saúde da carteira em tempo real. Acompanhe a evolução do seu portfólio contra benchmarks como CDI e IBOV.',
    target: '#kpi-strip',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-2)]">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    title: 'Explorer',
    description:
      'Explore todas as ações da B3 com filtros avançados, ordenação por qualquer indicador e rankings ao vivo. Clique em uma ação para ver a análise completa.',
    target: '[data-tour="explorer"]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-2)]">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    action: { label: 'Explorar', href: '/explorer' },
  },
  {
    title: 'aQ Intelligence™',
    description:
      'Motor proprietário que analisa 20 indicadores com calibração setorial, detecção de regime e diagnóstico IA. Scores de 81+ são Excepcionais, 61-80 Saudáveis, 31-60 Atenção e abaixo de 30 Críticos.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-2)]">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
  },
]

export function OnboardingTour() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  // Highlight target element when step changes
  useEffect(() => {
    if (!isOpen || showQuiz) return
    const step = steps[currentStep]
    if (!step?.target) return

    const el = document.querySelector(step.target)
    if (el) {
      el.classList.add('tour-spotlight')
      return () => el.classList.remove('tour-spotlight')
    }
  }, [isOpen, currentStep, showQuiz])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Após último step do tour, mostrar quiz de perfil
      setShowQuiz(true)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsOpen(false)
  }

  const handleAction = (href: string) => {
    handleComplete()
    router.push(href)
  }

  if (!isOpen) return null

  const step = steps[currentStep]!
  const isLast = currentStep === steps.length - 1

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-[var(--radius)] border border-[var(--border-1)]/50 overflow-hidden"
            style={{
              background: 'color-mix(in srgb, var(--surface-1) 85%, transparent)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Content */}
            <div className="p-8">
              {showQuiz ? (
                <InvestorProfileQuiz
                  onComplete={() => handleComplete()}
                  onSkip={handleComplete}
                />
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-center text-center"
                    >
                      {/* Icon */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mb-5"
                      >
                        {step.icon}
                      </motion.div>

                      {/* Step counter */}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-1)]/60 mb-2">
                        {currentStep + 1} de {steps.length}
                      </span>

                      {/* Title */}
                      <h2 className="text-[var(--text-heading)] font-bold mb-3">{step.title}</h2>

                      {/* Description */}
                      <p className="text-[var(--text-small)] text-[var(--text-2)] leading-relaxed">
                        {step.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Footer */}
                  <div className="mt-6">
                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mb-5">
                      {steps.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentStep(i)}
                          className={cn(
                            'h-1.5 rounded-full transition-all duration-300',
                            i === currentStep
                              ? 'w-6 bg-[var(--accent-1)]'
                              : i < currentStep
                                ? 'w-1.5 bg-[var(--accent-1)]/40'
                                : 'w-1.5 bg-[var(--border-1)]'
                          )}
                        />
                      ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleSkip}
                        className="text-[var(--text-caption)] text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
                      >
                        Pular
                      </button>
                      <div className="flex items-center gap-2">
                        {step.action && (
                          <button
                            onClick={() => handleAction(step.action!.href)}
                            className="px-4 py-2 rounded-lg text-[var(--text-small)] font-medium text-[var(--accent-1)] border border-[var(--accent-1)]/30 hover:bg-[var(--accent-1)]/10 transition-colors"
                          >
                            {step.action.label}
                          </button>
                        )}
                        <button
                          onClick={handleNext}
                          className={cn(
                            'px-5 py-2 rounded-lg text-[var(--text-small)] font-medium transition-all',
                            'bg-[var(--accent-1)] text-white hover:bg-[var(--accent-1)]/90',
                            'hover:shadow-[var(--accent-1)]/20'
                          )}
                        >
                          {isLast ? 'Descobrir meu perfil' : 'Próximo'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
