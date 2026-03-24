/**
 * Planos InvestIQ — configuracao de billing.
 *
 * Fonte de verdade para planos, precos e features exibidos na UI.
 * O billing real e processado pelo backend (Mercado Pago webhook).
 */

export type PlanType = 'free' | 'pro' | 'elite'

export interface Plan {
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
  }
  features: string[]
}

export const PLANS: Record<PlanType, Plan> = {
  free: {
    name: 'Free',
    description: 'Para quem esta comecando a investir.',
    price: { monthly: 0, yearly: 0 },
    features: [
      'Cotacoes em tempo real (15min delay)',
      'Dados financeiros CVM',
      'Historico de dividendos',
      'Comparativo de peers',
      'Screener basico',
    ],
  },
  pro: {
    name: 'Pro',
    description: 'Inteligencia completa para investidores serios.',
    price: { monthly: 59.90, yearly: 479.00 },
    features: [
      'IQ-Score completo com evidencias XAI',
      'Tese narrativa por ativo',
      'Preco justo (DCF + Gordon + Multiplos)',
      'Monte Carlo e margem de seguranca',
      'Screener avancado por mandato',
      'Carteira pessoal ilimitada',
      'Smart Contribution',
      'Alertas WhatsApp + Email',
      'Score de Seguranca do Dividendo',
      'Radar de dividendos',
    ],
  },
  elite: {
    name: 'Elite',
    description: 'Para gestores e investidores profissionais.',
    price: { monthly: 149.90, yearly: 1199.00 },
    features: [
      'Tudo do Pro',
      'Backtest personalizado',
      'Dossie qualitativo 6 dimensoes',
      'API de acesso programatico',
      'Suporte prioritario',
    ],
  },
}
