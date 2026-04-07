'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { IQSymbol, Wordmark } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────
type InvestorProfile = 'conservative' | 'moderate' | 'aggressive'
type Goal = 'growth' | 'dividends' | 'fire' | 'tracking'

interface ProfileOption {
  value: InvestorProfile
  title: string
  description: string
  icon: React.ReactNode
}

interface GoalOption {
  value: Goal
  title: string
  icon: React.ReactNode
}

// ─── Data ────────────────────────────────────────────────────────────
const PROFILES: ProfileOption[] = [
  {
    value: 'conservative',
    title: 'Conservador',
    description: 'Priorizo segurança e renda fixa, com pouca exposição a risco.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    value: 'moderate',
    title: 'Moderado',
    description: 'Busco equilíbrio entre renda fixa e variável.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
    ),
  },
  {
    value: 'aggressive',
    title: 'Arrojado',
    description: 'Aceito volatilidade em busca de retornos maiores.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
]

const SECTORS = [
  'Bancos',
  'Energia',
  'Varejo',
  'Saúde',
  'Tecnologia',
  'Siderurgia',
  'Mineração',
  'Petróleo',
  'Saneamento',
  'Seguros',
] as const

const GOALS: GoalOption[] = [
  {
    value: 'growth',
    title: 'Crescimento de patrimônio',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    value: 'dividends',
    title: 'Renda passiva com dividendos',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    value: 'fire',
    title: 'Independência financeira (FIRE)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    value: 'tracking',
    title: 'Apenas acompanhar minhas ações',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
]

const STEP_LABELS = ['Perfil', 'Setores', 'Meta']

// ─── Component ───────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { update } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null)
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine if current step has a valid selection
  const isStepValid =
    (step === 0 && investorProfile !== null) ||
    (step === 1 && selectedSectors.length > 0) ||
    (step === 2 && goal !== null)

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    )
  }

  const handleNext = () => {
    if (step < 2) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!investorProfile || selectedSectors.length === 0 || !goal) return

    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorProfile,
          sectors: selectedSectors,
          goal,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to complete onboarding')
      }

      // Update local session state
      update({ onboardingCompleted: true })

      router.push('/dashboard')
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('Erro ao salvar preferências. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <IQSymbol size={36} />
        <Wordmark fontSize={22} />
      </div>

      {/* Progress bar */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  i < step
                    ? 'bg-[var(--accent-1)] text-white'
                    : i === step
                      ? 'bg-[var(--accent-1)] text-white shadow-[var(--accent-1)]/30'
                      : 'bg-[var(--surface-2)] text-[var(--text-2)]'
                )}
              >
                {i < step ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium transition-colors duration-300 hidden sm:inline',
                  i <= step
                    ? 'text-[var(--text-1)]'
                    : 'text-[var(--text-2)]'
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--accent-1)] to-teal rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="w-full min-h-[340px]">
        {/* Step 1: Investor Profile */}
        <div
          className={cn(
            'transition-all duration-300',
            step === 0
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 absolute pointer-events-none translate-x-[-20px]'
          )}
        >
          <h2 className="text-xl font-bold mb-1 text-[var(--text-1)]">
            Qual é o seu perfil de investidor?
          </h2>
          <p className="text-sm text-[var(--text-2)] mb-6">
            Isso nos ajuda a personalizar sua experiência.
          </p>

          <div className="grid gap-3">
            {PROFILES.map((profile) => (
              <button
                key={profile.value}
                type="button"
                onClick={() => setInvestorProfile(profile.value)}
                className={cn(
                  'w-full text-left p-4 rounded-[var(--radius)] border transition-all duration-200',
                  'hover:bg-[var(--surface-2)]',
                  'bg-[var(--surface-1)]',
                  investorProfile === profile.value
                    ? 'border-[var(--accent-1)] shadow-[var(--accent-1)]/10 ring-1 ring-[var(--accent-1)]/50'
                    : 'border-[var(--border-1)] hover:border-[var(--text-2)]/30'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-[var(--radius)] flex items-center justify-center transition-colors duration-200',
                      investorProfile === profile.value
                        ? 'bg-[var(--accent-1)]/15 text-[var(--accent-1)]'
                        : 'bg-[var(--surface-2)] text-[var(--text-2)]'
                    )}
                  >
                    {profile.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text-1)]">
                      {profile.title}
                    </h3>
                    <p className="text-sm text-[var(--text-2)] mt-0.5">
                      {profile.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 transition-all duration-200',
                      investorProfile === profile.value
                        ? 'border-[var(--accent-1)] bg-[var(--accent-1)]'
                        : 'border-[var(--border-1)]'
                    )}
                  >
                    {investorProfile === profile.value && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-full h-full p-0.5">
                        <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Sectors */}
        <div
          className={cn(
            'transition-all duration-300',
            step === 1
              ? 'opacity-100 translate-x-0'
              : step < 1
                ? 'opacity-0 absolute pointer-events-none translate-x-[20px]'
                : 'opacity-0 absolute pointer-events-none translate-x-[-20px]'
          )}
        >
          <h2 className="text-xl font-bold mb-1 text-[var(--text-1)]">
            Quais setores te interessam?
          </h2>
          <p className="text-sm text-[var(--text-2)] mb-6">
            Selecione um ou mais setores para personalizar suas recomendações.
          </p>

          <div className="flex flex-wrap gap-2.5">
            {SECTORS.map((sector) => {
              const isSelected = selectedSectors.includes(sector)
              return (
                <button
                  key={sector}
                  type="button"
                  onClick={() => toggleSector(sector)}
                  className={cn(
                    'px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium border transition-all duration-200',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    isSelected
                      ? 'bg-[var(--accent-1)]/15 border-[var(--accent-1)] text-[var(--accent-1)] shadow-[var(--accent-1)]/10'
                      : 'bg-[var(--surface-1)] border-[var(--border-1)] text-[var(--text-2)] hover:border-[var(--text-2)]/30 hover:bg-[var(--surface-2)]'
                  )}
                >
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="inline-block mr-1.5 -mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {sector}
                </button>
              )
            })}
          </div>

          {selectedSectors.length > 0 && (
            <p className="text-xs text-[var(--text-2)] mt-4">
              {selectedSectors.length} {selectedSectors.length === 1 ? 'setor selecionado' : 'setores selecionados'}
            </p>
          )}
        </div>

        {/* Step 3: Goal */}
        <div
          className={cn(
            'transition-all duration-300',
            step === 2
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 absolute pointer-events-none translate-x-[20px]'
          )}
        >
          <h2 className="text-xl font-bold mb-1 text-[var(--text-1)]">
            Qual é sua meta principal?
          </h2>
          <p className="text-sm text-[var(--text-2)] mb-6">
            Isso nos ajuda a destacar o que é mais relevante para você.
          </p>

          <div className="grid gap-3">
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoal(g.value)}
                className={cn(
                  'w-full text-left p-4 rounded-[var(--radius)] border transition-all duration-200',
                  'hover:bg-[var(--surface-2)]',
                  'bg-[var(--surface-1)]',
                  goal === g.value
                    ? 'border-[var(--accent-1)] shadow-[var(--accent-1)]/10 ring-1 ring-[var(--accent-1)]/50'
                    : 'border-[var(--border-1)] hover:border-[var(--text-2)]/30'
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-[var(--radius)] flex items-center justify-center transition-colors duration-200',
                      goal === g.value
                        ? 'bg-[var(--accent-1)]/15 text-[var(--accent-1)]'
                        : 'bg-[var(--surface-2)] text-[var(--text-2)]'
                    )}
                  >
                    {g.icon}
                  </div>
                  <span
                    className={cn(
                      'font-medium transition-colors duration-200',
                      goal === g.value
                        ? 'text-[var(--text-1)]'
                        : 'text-[var(--text-2)]'
                    )}
                  >
                    {g.title}
                  </span>
                  <div
                    className={cn(
                      'flex-shrink-0 w-5 h-5 rounded-full border-2 ml-auto transition-all duration-200',
                      goal === g.value
                        ? 'border-[var(--accent-1)] bg-[var(--accent-1)]'
                        : 'border-[var(--border-1)]'
                    )}
                  >
                    {goal === g.value && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-full h-full p-0.5">
                        <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="w-full p-3 rounded-lg bg-red/10 border border-red/20 text-red text-sm text-center">
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="w-full flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-1)]">
        <div>
          {step > 0 && (
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Voltar
            </Button>
          )}
        </div>

        <div>
          {step < 2 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!isStepValid}
            >
              Próximo
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!isStepValid || isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Preparando...' : 'Começar a investir'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
