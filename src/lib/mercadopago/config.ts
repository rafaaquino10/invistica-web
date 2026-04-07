import { MercadoPagoConfig, PreApproval } from 'mercadopago'

// Mercado Pago client - only created if MERCADOPAGO_ACCESS_TOKEN is available
const accessToken = process.env['MERCADOPAGO_ACCESS_TOKEN']
const mpClient = accessToken
  ? new MercadoPagoConfig({ accessToken })
  : null

export const preApprovalClient = mpClient ? new PreApproval(mpClient) : null

export const MP_CONFIG = {
  webhookSecret: process.env['MERCADOPAGO_WEBHOOK_SECRET'] ?? '',
}

// ─── Preços Oficiais (fonte única de verdade) ────────────────
// Pro: R$ 39/mês | R$ 390/ano (~2 meses grátis)
// Premium (interno: 'elite'): R$ 79/mês | R$ 790/ano (~2 meses grátis)

// Subscription config per plan/interval (values in BRL)
export const MP_SUBSCRIPTION_CONFIG = {
  pro: {
    monthly: { amount: 39, frequency: 1, frequencyType: 'months' as const },
    yearly: { amount: 390, frequency: 12, frequencyType: 'months' as const },
  },
  elite: {
    monthly: { amount: 79, frequency: 1, frequencyType: 'months' as const },
    yearly: { amount: 790, frequency: 12, frequencyType: 'months' as const },
  },
} as const

// Trial gratuito de 14 dias — aplicado a todas as assinaturas pagas
export const MP_FREE_TRIAL = {
  frequency: 14,
  frequency_type: 'days' as const,
} as const

// ─── Display names (UI pública) ──────────────────────────────
// O identificador interno é 'elite', mas na UI exibimos "Premium"
export const PLAN_DISPLAY_NAMES: Record<PlanType, string> = {
  free: 'Free',
  pro: 'Pro',
  elite: 'Premium',
}

// Plan features
export const PLANS = {
  free: {
    name: 'Free',
    displayName: 'Free',
    description: 'Análise completa, sem custo',
    price: { monthly: 0, yearly: 0 },
    features: [
      'Explorer completo (todas as ações)',
      'IQ Score™ ilimitado',
      'Screener com todos os filtros',
      '1 carteira com até 20 ativos',
      'Comparação de até 4 ativos',
      'Dados em tempo real',
      'Diagnóstico básico',
    ],
    limits: {
      portfolios: 1,
      assetsPerPortfolio: 20,
      screenerFilters: -1,
      aqScorePerDay: -1,
      explorerAssets: -1,
    },
  },
  pro: {
    name: 'Pro',
    displayName: 'Pro',
    description: 'Para investidores ativos',
    price: { monthly: 39, yearly: 390 },
    features: [
      'Explorer completo (200+ ativos)',
      'IQ Score™ ilimitado',
      'Screener com todos os filtros',
      '5 carteiras, ativos ilimitados',
      'Comparação de até 4 ativos',
      'Projeção de dividendos',
      'Importação CSV',
      'Suporte prioritário',
    ],
    limits: {
      portfolios: 5,
      assetsPerPortfolio: -1,
      screenerFilters: -1,
      aqScorePerDay: -1,
      explorerAssets: 200,
    },
  },
  elite: {
    name: 'Premium',
    displayName: 'Premium',
    description: 'Inteligência institucional para você',
    price: { monthly: 79, yearly: 790 },
    features: [
      'Tudo do Pro, mais:',
      'Carteiras ilimitadas',
      'Diagnósticos IA completos (Análise aQ)',
      'Score X-Ray (18 sub-indicadores)',
      'DCF + Valor Intrínseco',
      'Alertas proativos + Radar aQ',
      'Monte Carlo + Sensibilidade Macro',
      'Export CSV ilimitado',
      'Suporte VIP',
    ],
    limits: {
      portfolios: -1,
      assetsPerPortfolio: -1,
      screenerFilters: -1,
      aqScorePerDay: -1,
      explorerAssets: -1,
    },
  },
} as const

export type PlanType = keyof typeof PLANS
export type BillingInterval = 'monthly' | 'yearly'

/**
 * Retorna o nome de exibição do plano para a UI.
 * Ex: 'elite' → 'Premium', 'pro' → 'Pro'
 */
export function getPlanDisplayName(plan: PlanType | string): string {
  return PLAN_DISPLAY_NAMES[plan as PlanType] ?? plan
}
