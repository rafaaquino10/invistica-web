import type { Metadata } from 'next'
import Link from 'next/link'
import { Button, Card, CardContent } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Acesso Antecipado | InvestIQ',
  description: 'Acesso antecipado gratuito a todas as funcionalidades do InvestIQ.',
}

const features = [
  'IQ-Score para 947 ativos da B3',
  'Screener com 50+ filtros',
  'Carteiras ilimitadas',
  'Backtest customizável (2012-2025)',
  'Regime Macro + Rotação Setorial',
  'Dossiê Qualitativo (6 dimensões)',
  'Dividend Safety + Trap Detection',
  'Alertas de preço, score e dividendos',
  'Valuation DCF + Gordon + Monte Carlo',
  'Analytics: IC, Signal Decay, Sensitivity',
]

export default function PricingPage() {
  return (
    <div className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Acesso Antecipado
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Tudo liberado. Grátis.
        </h1>
        <p className="text-xl text-[var(--text-2)] mb-12 max-w-xl mx-auto">
          Estamos em fase de acesso antecipado. Todas as funcionalidades estão
          disponíveis gratuitamente para os primeiros usuários.
        </p>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <div className="mb-6">
              <span className="text-5xl font-bold">R$ 0</span>
              <span className="text-[var(--text-2)] text-lg">/mês</span>
            </div>

            <ul className="space-y-3 text-left mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/register">
              <Button variant="primary" className="w-full">
                Criar conta gratuita
              </Button>
            </Link>

            <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-4">
              Sem cartão de crédito. Sem compromisso.
            </p>
          </CardContent>
        </Card>

        <p className="text-sm text-[var(--text-3)] mt-12 max-w-md mx-auto">
          Planos pagos serão introduzidos no futuro. Usuários do acesso antecipado
          terão condições especiais de lançamento.
        </p>
      </div>
    </div>
  )
}
