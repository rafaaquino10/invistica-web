'use client'

import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { Card, CardContent, Button } from '@/components/ui'
import { PLANS, type PlanType } from '@/lib/mercadopago/config'
import { cn } from '@/lib/utils'

interface PaywallGateProps {
  /**
   * Minimum plan required to access the content
   */
  requiredPlan: 'pro' | 'elite'
  /**
   * Feature name to display in the upgrade prompt
   */
  feature?: string
  /**
   * Content to show when user has access
   */
  children: React.ReactNode
  /**
   * Optional custom fallback component
   */
  fallback?: React.ReactNode
  /**
   * If true, shows a blurred preview instead of completely hiding
   */
  showPreview?: boolean
  /**
   * Additional class name for the container
   */
  className?: string
}

const planOrder: Record<PlanType, number> = {
  free: 0,
  pro: 1,
  elite: 2,
}

function hasAccess(userPlan: PlanType, requiredPlan: PlanType): boolean {
  return planOrder[userPlan] >= planOrder[requiredPlan]
}

export function PaywallGate({
  requiredPlan,
  feature,
  children,
  fallback,
  showPreview = false,
  className,
}: PaywallGateProps) {
  // Billing desativado — acesso antecipado gratuito.
  // Reativar paywall quando Mercado Pago estiver configurado.
  return <>{children}</>

  // eslint-disable-next-line no-unreachable
  const { user, status } = useAuth()

  // Demo mode: everything unlocked (no database configured)
  if (process.env['NEXT_PUBLIC_DEMO_MODE'] === 'true') {
    return <>{children}</>
  }

  // Still loading
  if (status === 'loading') {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-32 bg-[var(--surface-2)] rounded-[var(--radius)]" />
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <UpgradePrompt
        requiredPlan={requiredPlan}
        feature={feature}
        isAuthenticated={false}
        className={className}
      />
    )
  }

  // Demo mode: everything is unlocked for exploration
  const isDemo = user.email === 'demo@investiq.com.br'
  const userPlan = user.plan as PlanType || 'free'

  if (isDemo || hasAccess(userPlan, requiredPlan)) {
    return <>{children}</>
  }

  const plan = PLANS[requiredPlan]

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>
  }

  // Taste mode: dados reais visíveis com marca d'água sutil + CTA
  if (showPreview) {
    return (
      <div className={cn('relative group', className)}>
        <div className="pointer-events-none select-none opacity-75">{children}</div>
        {/* Marca d'água sutil */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[var(--radius)]">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg)]/80" />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[var(--accent-1)]/15 text-[var(--accent-1)]/70 border border-[var(--accent-1)]/20">
            {plan.name}
          </div>
        </div>
        {/* CTA que aparece no hover ou sempre no mobile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/95 to-transparent pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--text-2)]">
              {feature ? `${feature} — recurso ${plan.name}` : `Recurso ${plan.name}`}
            </p>
            <Link href="/pricing">
              <Button size="sm" className="whitespace-nowrap text-xs">
                Desbloquear
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Default upgrade prompt
  return (
    <UpgradePrompt
      requiredPlan={requiredPlan}
      feature={feature}
      isAuthenticated={true}
      className={className}
    />
  )
}

interface UpgradePromptProps {
  requiredPlan: 'pro' | 'elite'
  feature?: string
  isAuthenticated: boolean
  compact?: boolean
  className?: string
}

function UpgradePrompt({
  requiredPlan,
  feature,
  isAuthenticated,
  compact = false,
  className,
}: UpgradePromptProps) {
  const plan = PLANS[requiredPlan]

  if (compact) {
    return (
      <div className="text-center p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-2)] mb-3">
          {plan.name}
        </p>
        <p className="text-sm text-[var(--text-2)] mb-4">
          {feature ? `${feature} é um recurso ${plan.name}.` : `Este recurso requer o plano ${plan.name}.`}
        </p>
        <Link href="/pricing">
          <Button size="sm">Ver Planos</Button>
        </Link>
      </div>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="py-8">
        <div className="text-center max-w-md mx-auto">
          {/* Label */}
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-2)] mb-3">
            Recurso {plan.name}
          </p>

          {/* Title */}
          <h3 className="text-xl font-bold mb-2">
            {feature ? `Desbloqueie ${feature}` : `Faça upgrade para ${plan.name}`}
          </h3>

          {/* Description */}
          <p className="text-[var(--text-2)] mb-6">
            {isAuthenticated
              ? `Este recurso está disponível no plano ${plan.name}. Faça upgrade para desbloquear.`
              : `Faça login e assine o plano ${plan.name} para acessar este recurso.`}
          </p>

          {/* Features preview */}
          <div className="text-left bg-[var(--surface-2)] rounded-lg p-4 mb-6">
            <p className="text-sm font-medium mb-2">O que você ganha com {plan.name}:</p>
            <ul className="space-y-1.5">
              {plan.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-2)] flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl font-bold">R$ {plan.price.monthly.toFixed(2)}</span>
            <span className="text-[var(--text-2)]">/mês</span>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Link href="/pricing">
                <Button>Ver Planos</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button>Entrar</Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="secondary">Ver Planos</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Hook to check if user has access to a feature
 */
export function useHasAccess(requiredPlan: PlanType): boolean {
  const { user } = useAuth()

  if (!user) return false

  const plan = user.plan as PlanType || 'free'
  return hasAccess(plan, requiredPlan)
}

/**
 * Hook to get current user's plan
 */
export function useUserPlan(): PlanType {
  const { user } = useAuth()

  if (!user) return 'free'

  return user.plan as PlanType || 'free'
}
