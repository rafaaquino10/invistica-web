'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const QUIZ_STORAGE_KEY = 'investiq-investor-profile'

export type InvestorProfile = 'conservador' | 'moderado' | 'arrojado'

interface QuizQuestion {
  question: string
  options: { label: string; score: number }[]
}

const questions: QuizQuestion[] = [
  {
    question: 'Qual é o seu principal objetivo ao investir?',
    options: [
      { label: 'Preservar patrimônio e ter renda previsível', score: 0 },
      { label: 'Crescimento equilibrado com alguma renda', score: 1 },
      { label: 'Maximizar retorno no longo prazo', score: 2 },
    ],
  },
  {
    question: 'Se uma ação da sua carteira cair 30%, o que você faz?',
    options: [
      { label: 'Vendo para evitar mais perdas', score: 0 },
      { label: 'Aguardo e acompanho os fundamentos', score: 1 },
      { label: 'Compro mais se os fundamentos estiverem bons', score: 2 },
    ],
  },
  {
    question: 'Qual horizonte de investimento você prefere?',
    options: [
      { label: 'Menos de 2 anos', score: 0 },
      { label: 'De 2 a 5 anos', score: 1 },
      { label: 'Mais de 5 anos', score: 2 },
    ],
  },
  {
    question: 'Qual parcela da sua renda você investe mensalmente?',
    options: [
      { label: 'Até 10%', score: 0 },
      { label: 'Entre 10% e 30%', score: 1 },
      { label: 'Mais de 30%', score: 2 },
    ],
  },
]

const PROFILE_CONFIG: Record<InvestorProfile, { label: string; color: string; description: string; tip: string }> = {
  conservador: {
    label: 'Conservador',
    color: 'var(--color-info-500, #3B82F6)',
    description: 'Você prioriza segurança e previsibilidade. Prefere ações com dividendos consistentes e baixa volatilidade.',
    tip: 'Foque em ações com DY acima de 5%, baixo endividamento e scores de Risco altos no Invscore.',
  },
  moderado: {
    label: 'Moderado',
    color: 'var(--color-success-500, #00D4AA)',
    description: 'Você busca equilíbrio entre renda e crescimento. Aceita algum risco por retornos melhores.',
    tip: 'Equilibre ações de dividendos com crescimento. Use as carteiras inteligentes "Renda Passiva" e "Fortaleza" como referência.',
  },
  arrojado: {
    label: 'Arrojado',
    color: 'var(--color-premium-500, #F59E0B)',
    description: 'Você aceita volatilidade em busca de retornos superiores. Foco em crescimento e valuation.',
    tip: 'Explore ações com alto crescimento de receita e ROE elevado. A carteira "Top Invscore" tende a ter mais aderência ao seu perfil.',
  },
}

function getProfile(totalScore: number): InvestorProfile {
  if (totalScore <= 2) return 'conservador'
  if (totalScore <= 5) return 'moderado'
  return 'arrojado'
}

interface Props {
  onComplete: (profile: InvestorProfile) => void
  onSkip: () => void
}

export function InvestorProfileQuiz({ onComplete, onSkip }: Props) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [resultProfile, setResultProfile] = useState<InvestorProfile | null>(null)

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score]
    setAnswers(newAnswers)

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      const total = newAnswers.reduce((a, b) => a + b, 0)
      const profile = getProfile(total)
      setResultProfile(profile)
      localStorage.setItem(QUIZ_STORAGE_KEY, profile)
      setShowResult(true)
    }
  }

  if (showResult && resultProfile) {
    const config = PROFILE_CONFIG[resultProfile]
    return (
      <div className="flex flex-col items-center text-center">
        {/* Ícone de perfil */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)` }}
        >
          <span className="text-2xl font-bold" style={{ color: config.color }}>
            {config.label[0]}
          </span>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: config.color }}>
          Seu perfil
        </span>
        <h2 className="text-[var(--text-heading)] font-bold mb-2">
          Investidor {config.label}
        </h2>
        <p className="text-[var(--text-small)] text-[var(--text-2)] leading-relaxed mb-3">
          {config.description}
        </p>
        <div
          className="rounded-lg p-3 text-[var(--text-caption)] leading-relaxed mb-6 w-full"
          style={{
            backgroundColor: `color-mix(in srgb, ${config.color} 8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${config.color} 20%, transparent)`,
            color: 'var(--text-2)',
          }}
        >
          {config.tip}
        </div>
        <button
          onClick={() => onComplete(resultProfile)}
          className={cn(
            'px-6 py-2.5 rounded-lg text-[var(--text-small)] font-medium transition-all',
            'bg-[var(--accent-1)] text-white hover:bg-[var(--accent-1)]/90',
          )}
        >
          Começar a explorar
        </button>
      </div>
    )
  }

  const q = questions[currentQ]!

  return (
    <div className="flex flex-col items-center text-center">
      {/* Contador */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-1)]/60 mb-2">
        Pergunta {currentQ + 1} de {questions.length}
      </span>

      {/* Progresso */}
      <div className="flex gap-1.5 mb-5">
        {questions.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 rounded-full transition-all duration-300',
              i < currentQ ? 'w-6 bg-[var(--accent-1)]' :
              i === currentQ ? 'w-8 bg-[var(--accent-1)]' :
              'w-4 bg-[var(--border-1)]',
            )}
          />
        ))}
      </div>

      {/* Pergunta */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          <h2 className="text-[var(--text-base)] font-semibold mb-5 text-[var(--text-1)]">
            {q.question}
          </h2>

          <div className="space-y-2">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt.score)}
                className="w-full text-left px-4 py-3 rounded-lg border border-[var(--border-1)]/30 hover:border-[var(--accent-1)]/50 hover:bg-[var(--accent-1)]/5 transition-all text-[var(--text-small)] text-[var(--text-1)]"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pular */}
      <button
        onClick={onSkip}
        className="mt-4 text-[var(--text-caption)] text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
      >
        Pular quiz
      </button>
    </div>
  )
}

/**
 * Retorna o perfil do investidor salvo (ou null se não respondeu).
 */
export function getSavedProfile(): InvestorProfile | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(QUIZ_STORAGE_KEY) as InvestorProfile | null
}
