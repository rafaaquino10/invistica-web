// ─── Recommendation Engine ──────────────────────────────────
// Gera recomendações personalizadas baseadas no modo do usuário,
// regime macro e score dos ativos.

import type { AssetData } from '@/lib/data-source'

export type RecommendationMode = 'geral' | 'valor' | 'dividendos' | 'crescimento' | 'defensivo' | 'momento'

export interface Recommendation {
  ticker: string
  companyName: string
  sector: string
  price: number
  iqScore: number
  logo: string | null
  changePercent: number
  reason: string
  drivers: string[]
  mode: RecommendationMode
  confidence: 'alta' | 'media'
}

interface ModeFilter {
  filter: (a: AssetData) => boolean
  sort: (a: AssetData, b: AssetData) => number
  driversFn: (a: AssetData) => string[]
  reasonFn: (a: AssetData) => string
}

const MODE_CONFIGS: Record<RecommendationMode, ModeFilter> = {
  geral: {
    filter: (a) => (a.iqScore?.scoreTotal ?? 0) >= 60,
    sort: (a, b) => (b.iqScore?.scoreTotal ?? 0) - (a.iqScore?.scoreTotal ?? 0),
    driversFn: (a) => {
      const d: string[] = []
      if ((a.iqScore?.scoreQuanti ?? 0) >= 70) d.push('Alta qualidade')
      if ((a.iqScore?.scoreValuation ?? 0) >= 70) d.push('Valuation atrativo')
      if ((a.fundamentals.dividendYield ?? 0) >= 5) d.push(`DY ${(a.fundamentals.dividendYield ?? 0).toFixed(1)}%`)
      if ((a.iqScore?.scoreOperational ?? 0) >= 70) d.push('Crescimento sólido')
      return d.slice(0, 3)
    },
    reasonFn: (a) => `Score ${a.iqScore?.scoreTotal ?? 0}. ${buildReasonSnippet(a)}`,
  },
  valor: {
    filter: (a) => (a.iqScore?.scoreValuation ?? 0) >= 60 && (a.fundamentals.peRatio ?? 999) < 15,
    sort: (a, b) => (b.iqScore?.scoreValuation ?? 0) - (a.iqScore?.scoreValuation ?? 0),
    driversFn: (a) => {
      const d: string[] = []
      if (a.fundamentals.peRatio) d.push(`P/L ${a.fundamentals.peRatio.toFixed(1)}`)
      if (a.fundamentals.pbRatio) d.push(`P/VP ${a.fundamentals.pbRatio.toFixed(2)}`)
      if ((a.iqScore?.scoreQuanti ?? 0) >= 60) d.push('Qualidade sólida')
      return d.slice(0, 3)
    },
    reasonFn: (a) => `Valuation ${a.iqScore?.scoreValuation ?? 0}. P/L ${a.fundamentals.peRatio?.toFixed(1) ?? '—'} abaixo do setor.`,
  },
  dividendos: {
    filter: (a) => (a.fundamentals.dividendYield ?? 0) >= 4,
    sort: (a, b) => (b.fundamentals.dividendYield ?? 0) - (a.fundamentals.dividendYield ?? 0),
    driversFn: (a) => {
      const d: string[] = []
      d.push(`DY ${(a.fundamentals.dividendYield ?? 0).toFixed(1)}%`)
      if ((a.iqScore?.scoreQuali ?? 0) >= 60) d.push('Dividendos consistentes')
      if ((a.iqScore?.scoreQuanti ?? 0) >= 60) d.push('Risco controlado')
      return d.slice(0, 3)
    },
    reasonFn: (a) => `DY ${(a.fundamentals.dividendYield ?? 0).toFixed(1)}% sustentável. Score dividendos ${a.iqScore?.scoreQuali ?? 0}.`,
  },
  crescimento: {
    filter: (a) => (a.iqScore?.scoreOperational ?? 0) >= 55 && (a.fundamentals.crescimentoReceita5a ?? 0) > 5,
    sort: (a, b) => (b.iqScore?.scoreOperational ?? 0) - (a.iqScore?.scoreOperational ?? 0),
    driversFn: (a) => {
      const d: string[] = []
      if (a.fundamentals.crescimentoReceita5a) d.push(`Cresc. ${a.fundamentals.crescimentoReceita5a.toFixed(1)}%`)
      if ((a.fundamentals.roe ?? 0) >= 15) d.push(`ROE ${(a.fundamentals.roe ?? 0).toFixed(1)}%`)
      d.push('Potencial de valorização')
      return d.slice(0, 3)
    },
    reasonFn: (a) => `Crescimento ${a.iqScore?.scoreOperational ?? 0}. Receita cresceu ${(a.fundamentals.crescimentoReceita5a ?? 0).toFixed(1)}% em 5 anos.`,
  },
  defensivo: {
    filter: (a) => (a.iqScore?.scoreQuanti ?? 0) >= 65 && (a.fundamentals.liquidezCorrente ?? 0) >= 1,
    sort: (a, b) => (b.iqScore?.scoreQuanti ?? 0) - (a.iqScore?.scoreQuanti ?? 0),
    driversFn: (a) => {
      const d: string[] = []
      d.push('Baixo risco')
      if ((a.fundamentals.liquidezCorrente ?? 0) >= 1.5) d.push(`Liq. ${(a.fundamentals.liquidezCorrente ?? 0).toFixed(2)}`)
      if ((a.fundamentals.dividendYield ?? 0) >= 3) d.push(`DY ${(a.fundamentals.dividendYield ?? 0).toFixed(1)}%`)
      return d.slice(0, 3)
    },
    reasonFn: (a) => `Score risco ${a.iqScore?.scoreQuanti ?? 0}. Solidez financeira acima da média.`,
  },
  momento: {
    filter: (a) => (a.iqScore?.scoreTotal ?? 0) >= 50 && a.changePercent > 0,
    sort: (a, b) => b.changePercent - a.changePercent,
    driversFn: (a) => {
      const d: string[] = []
      d.push(`Alta +${a.changePercent.toFixed(2)}%`)
      if ((a.iqScore?.scoreTotal ?? 0) >= 70) d.push('Score forte')
      if (a.volume && a.volume > 1e6) d.push('Volume elevado')
      return d.slice(0, 3)
    },
    reasonFn: (a) => `Momento positivo +${a.changePercent.toFixed(2)}%. Score ${a.iqScore?.scoreTotal ?? 0} sustenta tendência.`,
  },
}

function buildReasonSnippet(a: AssetData): string {
  const parts: string[] = []
  if ((a.fundamentals.roe ?? 0) >= 15) parts.push(`ROE ${(a.fundamentals.roe ?? 0).toFixed(1)}%`)
  if ((a.fundamentals.dividendYield ?? 0) >= 5) parts.push(`DY ${(a.fundamentals.dividendYield ?? 0).toFixed(1)}%`)
  if ((a.fundamentals.peRatio ?? 999) < 10) parts.push(`P/L ${(a.fundamentals.peRatio ?? 0).toFixed(1)}`)
  return parts.join('. ') + (parts.length > 0 ? '.' : '')
}

/**
 * Gera recomendações baseadas no modo do usuário.
 * Exclui ações já em carteira.
 */
export function generateRecommendations(
  assets: AssetData[],
  mode: RecommendationMode = 'geral',
  excludeTickers: string[] = [],
  limit: number = 3,
): Recommendation[] {
  const excludeSet = new Set(excludeTickers.map(t => t.toUpperCase()))
  const config = MODE_CONFIGS[mode] ?? MODE_CONFIGS['geral']

  const candidates = assets
    .filter(a => !excludeSet.has(a.ticker) && a.iqScore && config.filter(a))
    .sort(config.sort)
    .slice(0, limit)

  return candidates.map(a => ({
    ticker: a.ticker,
    companyName: a.name,
    sector: a.sector,
    price: a.price,
    iqScore: a.iqScore?.scoreTotal ?? 0,
    logo: a.logo,
    changePercent: a.changePercent,
    reason: config.reasonFn(a),
    drivers: config.driversFn(a),
    mode,
    confidence: (a.iqScore?.scoreTotal ?? 0) >= 70 ? 'alta' : 'media',
  }))
}
