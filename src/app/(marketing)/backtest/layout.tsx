import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Backtest IQ-Score — 10 Anos de Resultados Reais | InvestIQ',
  description:
    'Resultados validados do modelo IQ-Score: Sharpe 0.78, Alpha +10.55% vs Ibovespa, 2015–2025. Curva de equity, quintis, walk-forward e estudo de ablação.',
  openGraph: {
    title: 'Backtest IQ-Score — 10 Anos de Resultados Reais',
    description:
      'Sharpe 0.78 · Alpha +10.55% · Walk-forward validado. Veja os resultados completos do modelo quantitativo IQ-Score.',
    type: 'article',
    url: '/backtest',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Backtest IQ-Score — 10 Anos de Resultados',
    description: 'Sharpe 0.78 · Alpha +10.55% vs Ibovespa · 2015–2025',
  },
}

export default function BacktestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
