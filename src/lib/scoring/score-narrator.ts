/**
 * Score Narrator — 3 camadas de experiência adaptativa
 *
 * Camada 1 (Free):  Badge semáforo + oneLiner
 * Camada 2 (Pro):   Research Note (parágrafo diagnóstico contextual)
 * Camada 3 (Elite): X-Ray completo (já existe em score-xray.tsx)
 *
 * 100% template-based e determinístico — sem LLM.
 * Inclui: trend score, sinal contrarian, beta, FCF coverage, regime.
 */

import type { AqScoreResult, AqClassificacao } from './iq-score'
import type { RegimeConfig } from './regime-detector'

// ─── Types ──────────────────────────────────────────────────────────

export interface ScoreNarrative {
  badge: { label: string; color: string; emoji: string }
  oneLiner: string
  researchNote: string
  highlights: {
    strengths: string[]
    weaknesses: string[]
    context: string
  }
}

// ─── Badge config ───────────────────────────────────────────────────

const BADGE_CONFIG: Record<AqClassificacao, { label: string; color: string; emoji: string }> = {
  Excepcional: { label: 'Excepcional', color: '#1A73E8', emoji: '' },
  Saudável:    { label: 'Saudável',    color: '#0D9488', emoji: '' },
  Atenção:     { label: 'Atenção',     color: '#D97706', emoji: '' },
  Crítico:     { label: 'Crítico',     color: '#EF4444', emoji: '' },
}

// ─── Pillar display names ───────────────────────────────────────────

const PILLAR_NAMES: Record<string, string> = {
  valuation: 'Valuation',
  qualidade: 'Qualidade',
  risco: 'Risco',
  dividendos: 'Dividendos',
  crescimento: 'Crescimento',
  qualitativo: 'Qualitativo',
}

// ─── Regime context strings ─────────────────────────────────────────

const REGIME_CONTEXT: Record<string, string> = {
  risk_off: 'Em regime de juros altos, dividendos e solidez ganham importância',
  neutral: 'Em regime neutro, todos os pilares contribuem de forma equilibrada',
  risk_on: 'Em regime de juros baixos, crescimento e valuation ganham destaque',
}

// ─── Helpers ────────────────────────────────────────────────────────

type PillarKey = keyof AqScoreResult['pilares']

function sortedPillars(pilares: AqScoreResult['pilares']): Array<{ key: PillarKey; nota: number; name: string }> {
  return (Object.entries(pilares) as Array<[PillarKey, { nota: number }]>)
    .map(([key, p]) => ({ key, nota: p.nota, name: PILLAR_NAMES[key] ?? key }))
    .sort((a, b) => b.nota - a.nota)
}

function bestPillar(pilares: AqScoreResult['pilares']): string {
  return sortedPillars(pilares)[0]?.name ?? 'Qualidade'
}

function worstPillar(pilares: AqScoreResult['pilares']): string {
  const sorted = sortedPillars(pilares)
  return sorted[sorted.length - 1]?.name ?? 'Risco'
}

function pillarVerdict(nota: number): string {
  if (nota >= 80) return 'excelente'
  if (nota >= 60) return 'sólido'
  if (nota >= 40) return 'moderado'
  if (nota >= 20) return 'fraco'
  return 'crítico'
}

function pillarGap(best: number, worst: number): string {
  const gap = best - worst
  if (gap >= 50) return 'A diferença entre o melhor e o pior pilar é significativa, indicando um perfil desequilibrado.'
  if (gap >= 30) return 'Há disparidade moderada entre os pilares, sugerindo pontos de atenção específicos.'
  return ''
}

// ─── One-liner generation ───────────────────────────────────────────

function generateOneLiner(
  classificacao: AqClassificacao,
  ticker: string,
  pilares: AqScoreResult['pilares'],
  result: AqScoreResult,
): string {
  const best = bestPillar(pilares)
  const worst = worstPillar(pilares)

  // Variações para evitar repetição entre ativos
  const trendUp = result.ajustes.trendAdjustment?.applied && result.ajustes.trendAdjustment.score > 0
  const trendDown = result.ajustes.trendAdjustment?.applied && result.ajustes.trendAdjustment.score < 0
  const contrarian = result.contrarian?.triggered

  switch (classificacao) {
    case 'Excepcional':
      if (trendUp) return `Excepcional — ${ticker} combina fundamentos fortes com tendência de melhora`
      return `Excepcional — ${ticker} é um dos ativos mais bem avaliados do mercado`
    case 'Saudável':
      if (trendDown) return `Saudável — ${ticker} mantém bons fundamentos, mas indicadores estão em leve queda`
      if (contrarian) return `Saudável — ${ticker} apresenta fundamentos sólidos com sinal contrarian ativo`
      return `Saudável — fundamentos sólidos com ${best} como destaque`
    case 'Atenção':
      if (trendDown) return `Atenção — ${ticker} mostra deterioração em ${worst}, tendência negativa`
      if (contrarian) return `Atenção — ${ticker} está abaixo da média histórica, possível oportunidade contrarian`
      return `Atenção — ${worst} merece monitoramento`
    case 'Crítico':
      if (contrarian) return `Crítico — ${ticker} em nível extremamente baixo, mas sinal contrarian detectado`
      return `Crítico — múltiplos indicadores em alerta`
  }
}

// ─── Research note generation ───────────────────────────────────────

function generateResearchNote(
  result: AqScoreResult,
  regime: RegimeConfig | null,
): string {
  const { score, classificacao, pilares, ticker, ajustes, metadata, contrarian } = result
  const sorted = sortedPillars(pilares)
  const best = sorted[0]!
  const worst = sorted[sorted.length - 1]!

  const sentences: string[] = []

  // Frase 1: Visão geral
  sentences.push(
    `${ticker} recebe nota ${score.toFixed(0)} (${classificacao}) no modelo Invscore, ` +
    `com base em ${metadata.indicadoresDisponiveis} de ${metadata.indicadoresTotais} indicadores avaliados.`
  )

  // Frase 2: Ponto forte e fraco com veredicto
  sentences.push(
    `O pilar mais forte é ${best.name} (${best.nota.toFixed(0)}/100, ${pillarVerdict(best.nota)}), ` +
    `enquanto ${worst.name} (${worst.nota.toFixed(0)}/100) é o ponto de maior atenção.`
  )

  // Frase 2b: Gap entre pilares (se relevante)
  const gapText = pillarGap(best.nota, worst.nota)
  if (gapText) sentences.push(gapText)

  // Frase 3: Ajustes relevantes (empilháveis — não excludentes)
  if (ajustes.penalPatrimNegativo) {
    sentences.push('O ativo possui patrimônio líquido negativo, o que limita a nota máxima a 25.')
  } else if (ajustes.penalTriploNegativo) {
    sentences.push('Três ou mais indicadores em nível crítico limitam a nota máxima a 15.')
  }

  if (metadata.confiabilidade < 50) {
    sentences.push(
      `A confiabilidade é de ${metadata.confiabilidade.toFixed(0)}% devido à disponibilidade limitada de dados, ` +
      `o que aplica um teto na pontuação.`
    )
  }

  // Frase 3b: Tendência (trend score)
  if (ajustes.trendAdjustment?.applied) {
    const trendPts = ajustes.trendAdjustment.score
    if (trendPts > 0) {
      sentences.push(`Os fundamentos mostram tendência de melhora (+${trendPts.toFixed(1)} pts), indicando evolução positiva nos últimos anos.`)
    } else {
      sentences.push(`Os fundamentos mostram tendência de deterioração (${trendPts.toFixed(1)} pts), com indicadores-chave em queda nos últimos anos.`)
    }
  }

  // Frase 3c: Beta penalty
  if (ajustes.betaPenalty?.applied && ajustes.betaPenalty.beta != null) {
    sentences.push(
      `O beta de ${ajustes.betaPenalty.beta.toFixed(2)} indica volatilidade ${ajustes.betaPenalty.beta > 1.5 ? 'elevada' : 'acima da média'} em relação ao IBOV, ` +
      `aplicando fator de ${ajustes.betaPenalty.penaltyFactor.toFixed(2)} na nota de risco.`
    )
  }

  // Frase 3d: Sentimento de notícias
  if (ajustes.sentimentAdjustment?.applied && ajustes.sentimentAdjustment.reason) {
    sentences.push(`Sentimento de notícias: ${ajustes.sentimentAdjustment.reason}.`)
  }

  // Frase 3e: CAGED
  if (ajustes.cagedAdjustment?.applied && ajustes.cagedAdjustment.trend) {
    const trendLabel = ajustes.cagedAdjustment.trend === 'expanding' ? 'melhora' : ajustes.cagedAdjustment.trend === 'contracting' ? 'piora' : 'estabilidade'
    sentences.push(`Dados de emprego (CAGED) indicam ${trendLabel} no setor, ajustando a nota em ${ajustes.cagedAdjustment.adjustment > 0 ? '+' : ''}${ajustes.cagedAdjustment.adjustment.toFixed(1)} pts.`)
  }

  // Frase 3f: Sinal contrarian
  if (contrarian?.triggered && contrarian.reason) {
    sentences.push(`Sinal contrarian detectado: ${contrarian.reason}. Indicadores abaixo da média histórica podem representar oportunidade de reversão.`)
  }

  // Frase 4: Contexto macro
  if (regime) {
    const regimeLabel = regime.regime === 'risk_off' ? 'juros altos'
      : regime.regime === 'risk_on' ? 'juros baixos' : 'neutro'

    if (regime.regime === 'risk_off' && pilares.dividendos.nota >= 70) {
      sentences.push(
        `Em cenário de ${regimeLabel}, o bom desempenho em Dividendos (${pilares.dividendos.nota.toFixed(0)}/100) ` +
        `é um diferencial positivo.`
      )
    } else if (regime.regime === 'risk_on' && pilares.crescimento.nota >= 70) {
      sentences.push(
        `Em cenário de ${regimeLabel}, a forte nota em Crescimento (${pilares.crescimento.nota.toFixed(0)}/100) ` +
        `favorece o ativo.`
      )
    } else {
      sentences.push(`O regime macro atual é de ${regimeLabel}, ${regime.description.toLowerCase()}.`)
    }
  }

  // Frase 5: Conclusão contextualizada
  if (classificacao === 'Excepcional') {
    if (ajustes.trendAdjustment?.applied && ajustes.trendAdjustment.score > 0) {
      sentences.push('Fundamentos excepcionais com tendência ascendente — perfil quantitativo de destaque no mercado brasileiro.')
    } else {
      sentences.push('Este é um dos ativos com melhor perfil quantitativo no mercado brasileiro.')
    }
  } else if (classificacao === 'Saudável') {
    if (contrarian?.triggered) {
      sentences.push('Fundamentos sólidos com possível oportunidade contrarian — vale acompanhar a evolução dos indicadores setoriais.')
    } else {
      sentences.push('Com fundamentos sólidos, o ativo apresenta boa relação risco-retorno no cenário atual.')
    }
  } else if (classificacao === 'Atenção') {
    sentences.push(`Recomenda-se acompanhamento próximo dos indicadores de ${worst.name} antes de novas posições.`)
  } else {
    sentences.push('Múltiplos indicadores em alerta sugerem cautela — avalie os fundamentos com atenção redobrada.')
  }

  return sentences.join(' ')
}

// ─── Highlights generation ──────────────────────────────────────────

function generateHighlights(
  result: AqScoreResult,
  regime: RegimeConfig | null,
): ScoreNarrative['highlights'] {
  const { pilares, ajustes, contrarian } = result
  const sorted = sortedPillars(pilares)

  const strengths = sorted
    .filter(p => p.nota >= 60)
    .slice(0, 3)
    .map(p => `${p.name} ${pillarVerdict(p.nota)} (${p.nota.toFixed(0)}/100)`)

  // Adicionar tendência positiva como força
  if (strengths.length < 3 && ajustes.trendAdjustment?.applied && ajustes.trendAdjustment.score > 0) {
    strengths.push('Tendência de melhora nos fundamentos')
  }

  const weaknesses = sorted
    .filter(p => p.nota < 40)
    .sort((a, b) => a.nota - b.nota)
    .slice(0, 3)
    .map(p => `${p.name} ${pillarVerdict(p.nota)} (${p.nota.toFixed(0)}/100)`)

  // Adicionar tendência negativa como fraqueza
  if (weaknesses.length < 3 && ajustes.trendAdjustment?.applied && ajustes.trendAdjustment.score < 0) {
    weaknesses.push('Tendência de deterioração nos fundamentos')
  }

  let context = regime
    ? REGIME_CONTEXT[regime.regime] ?? REGIME_CONTEXT['neutral']!
    : 'Sem dados de regime macro disponíveis'

  // Enriquecer contexto com contrarian
  if (contrarian?.triggered) {
    context += '. Sinal contrarian ativo — indicadores setoriais abaixo da média histórica'
  }

  return { strengths, weaknesses, context }
}

// ─── Score badge (lightweight — no AqScoreResult needed) ────────────

export interface ScoreBadgeInfo {
  label: string
  color: string
  emoji: string
}

function classifyScore(score: number): AqClassificacao {
  if (score >= 81) return 'Excepcional'
  if (score >= 61) return 'Saudável'
  if (score >= 31) return 'Atenção'
  return 'Crítico'
}

/**
 * Lightweight badge from just a numeric score.
 * Use in Explorer / Dashboard where full AqScoreResult isn't available.
 */
export function getScoreBadge(score: number): ScoreBadgeInfo {
  return BADGE_CONFIG[classifyScore(score)]
}

// ─── Main function ──────────────────────────────────────────────────

export function generateNarrative(
  scoreResult: AqScoreResult,
  regime: RegimeConfig | null = null,
): ScoreNarrative {
  const { classificacao, pilares, ticker } = scoreResult
  const badge = BADGE_CONFIG[classificacao]

  return {
    badge,
    oneLiner: generateOneLiner(classificacao, ticker, pilares, scoreResult),
    researchNote: generateResearchNote(scoreResult, regime),
    highlights: generateHighlights(scoreResult, regime),
  }
}
