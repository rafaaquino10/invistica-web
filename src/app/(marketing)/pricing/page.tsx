import type { Metadata } from 'next'
import Link from 'next/link'
import { Button, Card, CardContent, Badge } from '@/components/ui'
import { PLANS } from '@/lib/mercadopago/config'

export const metadata: Metadata = {
  title: 'Planos e Preços',
  description: 'Escolha o plano ideal para seus investimentos. Comece grátis e evolua conforme sua carteira cresce.',
}

const plans = [
  {
    key: 'free' as const,
    features: [
      { name: 'IQ Score™', value: 'Ilimitado' },
      { name: 'Screener', value: 'Todos os filtros' },
      { name: 'Carteiras', value: '1 carteira, 20 ativos' },
      { name: 'Indicadores', value: 'Todos (20)' },
      { name: 'Rankings', value: 'Completo' },
      { name: 'Benchmark', value: 'CDI/IBOV' },
      { name: 'Comparação', value: 'Até 4 ativos' },
      { name: 'Dados', value: 'Tempo real' },
    ],
    cta: 'Começar grátis',
    variant: 'secondary' as const,
    popular: false,
  },
  {
    key: 'pro' as const,
    features: [
      { name: 'IQ Score™', value: 'Ilimitado' },
      { name: 'Screener', value: '50+ filtros' },
      { name: 'Carteiras', value: '5 carteiras, ativos ilimitados' },
      { name: 'Indicadores', value: 'Todos + histórico' },
      { name: 'Rankings', value: 'Completo + export' },
      { name: 'Benchmark', value: 'Multi-benchmark customizável' },
      { name: 'Alertas', value: 'Ilimitados' },
      { name: 'Histórico', value: '5 anos' },
    ],
    cta: 'Testar 14 dias grátis',
    variant: 'primary' as const,
    popular: true,
  },
  {
    key: 'elite' as const,
    features: [
      { name: 'IQ Score™', value: 'Ilimitado + customizável' },
      { name: 'Screener', value: 'Todos os filtros' },
      { name: 'Carteiras', value: 'Ilimitadas' },
      { name: 'Indicadores', value: 'Todos + DCF + Valor Intrínseco' },
      { name: 'Rankings', value: 'Completo + API (futuro)' },
      { name: 'Benchmark', value: 'Todos + carteira customizada' },
      { name: 'Alertas', value: 'Ilimitados + IA' },
      { name: 'Histórico', value: '10+ anos' },
    ],
    extra: [
      'Relatórios em PDF exportáveis',
      'Projeção FIRE + simuladores avançados',
      'Suporte prioritário',
    ],
    cta: 'Testar 14 dias grátis',
    variant: 'secondary' as const,
    popular: false,
  },
]

const faqs = [
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim! Você pode cancelar sua assinatura a qualquer momento, sem multas ou burocracia. Seu acesso continua até o fim do período pago.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Aceitamos Pix, boleto e cartão de crédito. Os pagamentos são processados de forma segura pelo Mercado Pago.',
  },
  {
    q: 'O plano Free é realmente grátis?',
    a: 'Sim, o plano Free é 100% gratuito para sempre. Você pode usar as funcionalidades básicas sem limite de tempo.',
  },
  {
    q: 'Posso mudar de plano depois?',
    a: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. O valor é ajustado proporcionalmente.',
  },
]

export default function PricingPage() {
  return (
    <div className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold">
            Planos simples, valor real
          </h1>
          <p className="mt-4 text-xl text-[var(--text-2)] max-w-2xl mx-auto">
            Comece grátis e evolua conforme sua carteira cresce.
            Sem surpresas, sem letras miúdas.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const config = PLANS[plan.key]
            const price = config.price.monthly

            return (
              <Card
                key={plan.key}
                padding="lg"
                className={plan.popular ? 'relative border-2 border-[var(--accent-1)]' : ''}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="primary">Mais popular</Badge>
                  </div>
                )}
                <CardContent className="h-full flex flex-col">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold">{config.name}</h2>
                    <p className="text-sm text-[var(--text-2)]">{config.description}</p>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-[var(--text-2)]">/mês</span>
                    {config.price.yearly > 0 && (
                      <p className="text-xs text-[var(--text-3)] mt-1">
                        ou R$ {config.price.yearly}/ano (~2 meses grátis)
                      </p>
                    )}
                  </div>

                  <div className="flex-1">
                    <ul className="space-y-4 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature.name} className="flex items-start gap-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-[var(--text-3)] flex-shrink-0 mt-0.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <div>
                            <span className="text-sm font-medium">{feature.name}:</span>
                            <span className="text-sm text-[var(--text-2)] ml-1">
                              {feature.value}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {plan.extra && (
                      <div className="pt-4 border-t border-[var(--border-1)]">
                        <p className="text-xs font-medium text-[var(--text-2)] mb-2">
                          Extras exclusivos:
                        </p>
                        <ul className="space-y-2">
                          {plan.extra.map((item) => (
                            <li key={item} className="flex items-center gap-2 text-sm">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-[var(--accent-1)]"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <Link href={(price === 0 ? '/register' : '/register?plan=' + plan.key) as any}>
                      <Button variant={plan.variant} className="w-full">
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ — editorial style, no cards */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Perguntas frequentes</h2>
          <div className="divide-y divide-[var(--border-1)]/30">
            {faqs.map((faq, index) => (
              <div key={index} className="py-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-[var(--text-2)] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
