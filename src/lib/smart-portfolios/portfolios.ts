// ─── Smart Portfolio Definitions ─────────────────────────────
// 7 algorithmic portfolios with transparent quantitative criteria.
// Calibrados com visão de Chief Economist focado em equities BR.

import type { SmartPortfolio } from './types'

export const SMART_PORTFOLIOS: SmartPortfolio[] = [

  // ═══ 1. VALOR PROFUNDO ═══
  // Tese: comprar empresas saudáveis negociando abaixo do valor intrínseco.
  // Critério central: múltiplos comprimidos + margem positiva.
  // Sem filtro de ROE (turnarounds têm ROE deprimido — é o ponto).
  {
    id: 'deep-value',
    name: 'Valor Profundo',
    description: 'Empresas saudáveis negociando abaixo do valor justo. Comprar barato, vender quando o mercado reconhecer.',
    icon: 'V',
    criteria: {
      minScore: 50,
      minLensScore: { lens: 'value', min: 60 },
      maxPL: 15,
      maxDivEbitda: 3.0,
      minMarginLiq: 3,
      minLiquidityFactor: 0.80,
      minConfidence: 70,
    },
    sortBy: 'lensScores.value',
    sortDirection: 'desc',
    maxStocks: 15,
    exitCriteria: [
      {
        condition: 'pl_above_sector_median',
        description: 'P/L atingiu ou ultrapassou a mediana do setor — mercado reconheceu o valor',
      },
      {
        condition: 'value_lens_below_40',
        description: 'Score Valor caiu abaixo de 40 — empresa ficou cara ou deteriorou',
      },
      {
        condition: 'margin_negative_2q',
        description: 'Margem líquida negativa por 2 trimestres — value trap',
      },
    ],
    thesisGuard: (a) => (a.lensScores?.value ?? 0) > 0,
  },

  // ═══ 2. QUALIDADE JUSTA (Buffett/Munger) ═══
  // Tese: comprar empresa excelente a preço justo e carregar.
  // Moat + gestão + governança + resultados consistentes.
  // P/L razoável (não precisa ser o mais barato, mas não pode ser caro).
  // Sair quando o mercado reconhecer o valor (P/L > mediana do setor).
  {
    id: 'quality-value',
    name: 'Qualidade Justa',
    description: 'Empresa excelente a preço justo. Moat, gestão, governança e resultados — carregar até o mercado reconhecer.',
    icon: 'B',
    criteria: {
      minScore: 60,
      minScoreQuality: 55,
      minROE: 12,
      maxPL: 20,
      maxDivEbitda: 2.5,
      minMarginLiq: 5,
      minMarginEbit: 8,
      minLiquidityFactor: 0.80,
      minConfidence: 75,
    },
    sortBy: 'scoreTotal',
    sortDirection: 'desc',
    maxStocks: 12,
    exitCriteria: [
      {
        condition: 'pl_above_sector_median',
        description: 'P/L atingiu ou ultrapassou a mediana do setor — mercado reconheceu o valor',
      },
      {
        condition: 'quality_score_below_45',
        description: 'Score Qualidade caiu abaixo de 45 — empresa deteriorou fundamentos',
      },
      {
        condition: 'roe_below_8',
        description: 'ROE caiu abaixo de 8% — retorno sobre capital não justifica posição',
      },
      {
        condition: 'margin_negative_2q',
        description: 'Margem líquida negativa por 2 trimestres — tese quebrou',
      },
    ],
    thesisGuard: (a) => {
      // Qualidade mínima: pilar qualidade precisa ser decente
      return (a.aqScore?.scoreQuality ?? 0) >= 55
    },
  },

  // ═══ RENDA PASSIVA ═══
  // Tese: dividendos sustentáveis e previsíveis de longo prazo.
  // Filtros de sustentabilidade: payout máx 90%, risco mín 40, dívida máx 2.5x.
  {
    id: 'passive-income',
    name: 'Renda Passiva',
    description: 'Dividendos consistentes e sustentáveis. Foco em previsibilidade de longo prazo.',
    icon: 'R',
    criteria: {
      minDY: 5,
      maxDY: 15,
      minScore: 50,
      minLensScore: { lens: 'dividends', min: 60 },
      maxDivEbitda: 2.5,
      maxPayout: 90,
      minScoreRisk: 40,
      minLiquidityFactor: 0.80,
      minConfidence: 70,
    },
    sortBy: 'lensScores.dividends',
    sortDirection: 'desc',
    maxStocks: 15,
    exitCriteria: [
      {
        condition: 'dy_dropped_50pct',
        description: 'DY caiu mais de 50% — empresa cortou dividendos',
      },
      {
        condition: 'risk_score_below_30',
        description: 'Score de Risco abaixo de 30 — risco elevado para renda passiva',
      },
      {
        condition: 'payout_above_120',
        description: 'Payout acima de 120% por 2 trimestres — distribuição insustentável',
      },
    ],
    thesisGuard: (a) => a.fundamentals.dividendYield != null && a.fundamentals.dividendYield > 0,
  },

  // ═══ 3. CRESCIMENTO ═══
  // Tese: empresas expandindo receita e lucro com qualidade.
  // Gate de qualidade: ROE 15%, margem EBIT 8%, score quality 50.
  {
    id: 'growth',
    name: 'Crescimento',
    description: 'Empresas expandindo receita e lucro de forma acelerada. Aceita pagar mais caro por crescimento comprovado.',
    icon: 'C',
    criteria: {
      minScore: 50,
      minLensScore: { lens: 'growth', min: 65 },
      minROE: 15,
      minMarginEbit: 8,
      minScoreQuality: 50,
      minCrescRec5a: 8,
      minLiquidityFactor: 0.80,
      minConfidence: 70,
    },
    sortBy: 'lensScores.growth',
    sortDirection: 'desc',
    maxStocks: 10,
    exitCriteria: [
      {
        condition: 'growth_score_dropped_20pts',
        description: 'Score Crescimento caiu >20 pontos — desaceleração',
      },
      {
        condition: 'margin_contracting',
        description: 'Margem EBIT caiu >5pp — crescimento virando queima de caixa',
      },
      {
        condition: 'revenue_growth_negative',
        description: 'Crescimento receita 5a ficou negativo — tese quebrou',
      },
    ],
    thesisGuard: (a) => (a.lensScores?.growth ?? 0) > 0,
  },

  // ═══ 4. FORTALEZA (defensiva) ═══
  // Tese: balanço blindado, baixa volatilidade, resistência a crises.
  // A mais conservadora: confidence 80%, dívida máx 1.5x, beta máx 1.0.
  {
    id: 'fortress',
    name: 'Fortaleza',
    description: 'Balanço blindado e baixa volatilidade. Para dormir tranquilo em qualquer cenário.',
    icon: 'F',
    criteria: {
      minScore: 55,
      minLensScore: { lens: 'defensive', min: 65 },
      maxDivEbitda: 1.5,
      minROE: 10,
      maxBeta: 1.0,
      minLiquidityFactor: 0.90,
      minConfidence: 80,
    },
    sortBy: 'lensScores.defensive',
    sortDirection: 'desc',
    maxStocks: 12,
    exitCriteria: [
      {
        condition: 'debt_doubled',
        description: 'Dív/EBITDA dobrou — empresa se alavancou',
      },
      {
        condition: 'risk_score_below_50',
        description: 'Score Risco abaixo de 50 — não é mais defensiva',
      },
    ],
    thesisGuard: (a) => (a.lensScores?.defensive ?? 0) > 0,
  },

  // ═══ 5. MOMENTO FAVORÁVEL (timing + qualidade) ═══
  // Tese: empresas com fundamentos OK em tendência de alta.
  // Gate mínimo de fundamentos + volume para evitar manipulação.
  {
    id: 'momentum',
    name: 'Momento Favorável',
    description: 'Empresas boas em tendência de alta. Cruza fundamentos com timing de mercado.',
    icon: 'M',
    criteria: {
      minScore: 50,
      minScoreQuality: 40,
      minLiquidity: 500_000,
      minMarketCap: 2_000_000_000,
      minLiquidityFactor: 0.90,
      customFilter: 'momentum_bull',
    },
    sortBy: 'lensScores.momentum',
    sortDirection: 'desc',
    maxStocks: 8,
    exitCriteria: [
      {
        condition: 'momentum_turned_bear',
        description: 'Momento virou BEAR — tendência reverteu',
      },
      {
        condition: 'score_dropped_15pts',
        description: 'Score geral caiu >15 pontos — fundamentos deterioraram',
      },
      {
        condition: 'price_drop_15pct',
        description: 'Preço caiu >15% do pico — stop loss implícito',
      },
    ],
    thesisGuard: (a) => a.lensScores?.momentum != null,
  },

  // ═══ 6. ESG SUSTENTÁVEL ═══
  // Tese: proxy ESG via qualidade de gestão + governança + transparência contábil.
  // Sem filtro de setor (ESG não é função do setor).
  // Usa scoreQualitativo como proxy principal.
  {
    id: 'esg-sustentavel',
    name: 'ESG Sustentável',
    description: 'Empresas com governança exemplar e gestão de qualidade. Proxy: Novo Mercado + pilar qualitativo.',
    icon: 'E',
    criteria: {
      governance: 'novo_mercado',
      minROE: 12,
      maxDivEbitda: 2.5,
      minScore: 55,
      minScoreQuality: 50,
      minConfidence: 70,
      minLiquidityFactor: 0.80,
    },
    sortBy: 'scoreTotal',
    sortDirection: 'desc',
    maxStocks: 15,
    exitCriteria: [
      {
        condition: 'governance_downgrade',
        description: 'Saída do Novo Mercado — governança rebaixada',
      },
      {
        condition: 'score_below_40',
        description: 'Score aQ abaixo de 40 — qualidade deteriorou',
      },
    ],
    thesisGuard: (a) => (a.aqScore?.scoreQualitativo ?? 0) > 40,
  },

  // ═══ 7. QUANT PURO (dados puros, sem viés) ═══
  // Tese: multi-fator balanceado, top 25 por score, diversificado.
  // Score-weighted (maior convicção = maior alocação).
  // Max 25% por setor para evitar concentração.
  {
    id: 'quant-puro',
    name: 'Quant Puro',
    description: 'Multi-fator balanceado. O motor decide tudo — dados puros, sem viés humano. Top 25 por score ajustado ao regime.',
    icon: 'Q',
    criteria: {
      topN: 25,
      minLiquidity: 2_000_000,
      minConfidence: 70,
      maxSectorPct: 25,
      balanceRule: 'score_weight',
      customFilter: 'quant_top_n',
    },
    sortBy: 'scoreTotal',
    sortDirection: 'desc',
    maxStocks: 25,
    exitCriteria: [
      {
        condition: 'dropped_out_top30',
        description: 'Saiu do top 30 no rebalanceamento — buffer de 5 posições evita churn',
      },
      {
        condition: 'confidence_below_50',
        description: 'Confiança dos dados caiu abaixo de 50% — dados insuficientes',
      },
    ],
  },
]
