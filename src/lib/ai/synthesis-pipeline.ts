// ─── Pipeline de Síntese IA ──────────────────────────────────
// Gera diagnóstico inteligente via Claude API (padrão) ou Ollama (fallback).
// Cadeia: Claude Haiku → Ollama → Template determinístico.
// INT-10: Inteligência cruzada — news, RI CVM, CAGED, carteiras, DCF.

import { generateClaudeCompletion, isClaudeAvailable, IQ_SYSTEM_PROMPT } from './claude-client'
import { generateCompletion, isOllamaAvailable } from './ollama-client'
import { validateNarrative } from './guardrail'
import { generateNarrative } from '../scoring/score-narrator'
import type { AssetData } from '../data-source'
import type { MacroRegime } from '../scoring/regime-detector'
import { logger } from '../utils/logger'

// Cache em memória para narrativas IA (1h TTL)
const narrativeCache = new Map<string, { text: string; source: 'ai' | 'template'; cachedAt: number }>()
const NARRATIVE_TTL = 60 * 60 * 1000 // 1 hora

export interface DiagnosisInput {
  ticker: string
  name: string
  sector: string
  price: number
  scoreTotal: number
  classificacao: string
  pillarScores: {
    valuation: number
    quality: number
    risk: number
    dividends: number
    growth: number
    momentum?: number
  }
  fundamentals: {
    peRatio: number | null
    roe: number | null
    roic: number | null
    dividendYield: number | null
    netDebtEbitda: number | null
    margemLiquida: number | null
  }

  // Contexto expandido (INT-10)
  recentNews?: {
    count: number
    avgSentiment: number       // -1.0 a +1.0
    topPositive?: string       // título da notícia mais positiva
    topNegative?: string       // título da notícia mais negativa
    hasRelevantFact?: boolean  // fato relevante CVM nos últimos 7 dias
    relevantFactTitle?: string
  }
  cagedTrend?: {
    trend: 'expanding' | 'stable' | 'contracting'
    sector: string
  }
  portfolioContext?: {
    inPortfolios: string[]     // ex: ['passive-income', 'fortress']
    exitAlerts: string[]       // ex: ['DY caiu mais de 50%']
  }
  dcfUpside?: number | null    // % upside do DCF (se calculado)
}

interface MacroInput {
  regime: MacroRegime
  selicReal: number
}

/**
 * Gera diagnóstico inteligente para um ativo.
 * Fluxo: Dados Quant → Prompt estruturado → Ollama → Guardrail → Resultado
 * Fallback: template determinístico se Ollama indisponível ou guardrail falhar
 */
export async function generateAIDiagnosis(
  input: DiagnosisInput,
  macro: MacroInput,
): Promise<{ text: string; source: 'ai' | 'template' }> {
  // Checar cache
  const cacheKey = `${input.ticker}:${input.scoreTotal.toFixed(0)}`
  const cached = narrativeCache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < NARRATIVE_TTL) {
    return { text: cached.text, source: cached.source }
  }

  const prompt = buildDiagnosisPrompt(input, macro)
  const guardrailData = {
    roe: input.fundamentals.roe,
    roic: input.fundamentals.roic,
    pl: input.fundamentals.peRatio,
    dy: input.fundamentals.dividendYield,
    score: input.scoreTotal,
    divEbitda: input.fundamentals.netDebtEbitda,
  }
  const guardrailContext = { hasRelevantFact: input.recentNews?.hasRelevantFact ?? false }

  // Provider 1: Claude API (Haiku 4.5 — rápido e barato)
  if (isClaudeAvailable()) {
    try {
      const narrative = await generateClaudeCompletion(prompt, {
        model: 'haiku',
        temperature: 0.2,
        maxTokens: 600,
        systemPrompt: IQ_SYSTEM_PROMPT,
        timeoutMs: 15_000,
      })

      const validation = validateNarrative(narrative, guardrailData, guardrailContext)
      if (validation.passed) {
        const result = { text: narrative, source: 'ai' as const }
        narrativeCache.set(cacheKey, { ...result, cachedAt: Date.now() })
        return result
      }
      logger.warn(`Guardrail Claude falhou para ${input.ticker}`, { errors: validation.errors })
    } catch (err) {
      logger.warn(`Claude falhou para ${input.ticker}`, { error: String(err) })
    }
  }

  // Provider 2: Ollama local (fallback gratuito)
  if (await isOllamaAvailable()) {
    try {
      const narrative = await generateCompletion(prompt, { temperature: 0.2 })
      const validation = validateNarrative(narrative, guardrailData, guardrailContext)
      if (validation.passed) {
        const result = { text: narrative, source: 'ai' as const }
        narrativeCache.set(cacheKey, { ...result, cachedAt: Date.now() })
        return result
      }
      logger.warn(`Guardrail Ollama falhou para ${input.ticker}`, { errors: validation.errors })
    } catch (err) {
      logger.warn(`Ollama falhou para ${input.ticker}`, { error: String(err) })
    }
  }

  // Provider 3: Template determinístico (sempre funciona)
  return { text: buildTemplateFallback(input), source: 'template' }
}

function buildDiagnosisPrompt(input: DiagnosisInput, macro: MacroInput): string {
  const regimeLabel = macro.regime === 'risk_off'
    ? 'Juros Altos (Risk Off)'
    : macro.regime === 'risk_on'
      ? 'Juros Baixos (Risk On)'
      : 'Neutro'

  let prompt = `Você é um analista fundamentalista sênior brasileiro. Gere um diagnóstico conciso (máximo 4 bullets) para o ativo abaixo. Use APENAS os dados fornecidos — não invente números.

ATIVO: ${input.ticker} (${input.name})
SETOR: ${input.sector}
PREÇO: R$ ${input.price.toFixed(2)}
AQ SCORE: ${input.scoreTotal.toFixed(0)}/100 (${input.classificacao})

PILARES:
- Valuation: ${input.pillarScores.valuation.toFixed(0)}/100
- Qualidade: ${input.pillarScores.quality.toFixed(0)}/100
- Risco: ${input.pillarScores.risk.toFixed(0)}/100
- Dividendos: ${input.pillarScores.dividends.toFixed(0)}/100
- Crescimento: ${input.pillarScores.growth.toFixed(0)}/100
${input.pillarScores.momentum != null ? `- Momentum: ${input.pillarScores.momentum.toFixed(0)}/100` : ''}

INDICADORES:
- P/L: ${input.fundamentals.peRatio?.toFixed(1) ?? 'N/D'}
- ROE: ${input.fundamentals.roe?.toFixed(1) ?? 'N/D'}%
- ROIC: ${input.fundamentals.roic?.toFixed(1) ?? 'N/D'}%
- DY: ${input.fundamentals.dividendYield?.toFixed(1) ?? 'N/D'}%
- Dív/EBITDA: ${input.fundamentals.netDebtEbitda?.toFixed(1) ?? 'N/D'}

MACRO:
- Regime: ${regimeLabel}
- SELIC Real: ${isNaN(macro.selicReal) ? 'N/D' : macro.selicReal.toFixed(1)}%`

  // Contexto de notícias (INT-10)
  if (input.recentNews && input.recentNews.count > 0) {
    const sentLabel = input.recentNews.avgSentiment > 0 ? 'positivo'
      : input.recentNews.avgSentiment < 0 ? 'negativo' : 'neutro'
    prompt += `\n\nNOTÍCIAS RECENTES (${input.recentNews.count} artigos, sentimento médio: ${sentLabel}):`
    if (input.recentNews.topPositive) prompt += `\n- Destaque positivo: "${input.recentNews.topPositive}"`
    if (input.recentNews.topNegative) prompt += `\n- Destaque negativo: "${input.recentNews.topNegative}"`
    if (input.recentNews.hasRelevantFact) prompt += `\n- [ALERTA] FATO RELEVANTE CVM: "${input.recentNews.relevantFactTitle}"`
  }

  // CAGED (INT-10)
  if (input.cagedTrend) {
    const desc = input.cagedTrend.trend === 'expanding' ? 'contratando (positivo)' :
                 input.cagedTrend.trend === 'contracting' ? 'demitindo (negativo)' : 'estável'
    prompt += `\n\nDADO ALTERNATIVO — CAGED:\n- Setor ${input.cagedTrend.sector}: ${desc}`
  }

  // DCF (INT-10)
  if (input.dcfUpside != null) {
    prompt += `\n\nVALUATION DCF:\n- Upside estimado: ${input.dcfUpside > 0 ? '+' : ''}${input.dcfUpside.toFixed(1)}%`
  }

  // Carteiras inteligentes (INT-10)
  if (input.portfolioContext && input.portfolioContext.inPortfolios.length > 0) {
    prompt += `\n\nCARTEIRAS INTELIGENTES:\n- Presente em: ${input.portfolioContext.inPortfolios.join(', ')}`
    if (input.portfolioContext.exitAlerts.length > 0) {
      prompt += `\n- [ALERTA] Alertas de saída: ${input.portfolioContext.exitAlerts.join('; ')}`
    }
  }

  prompt += `\n\nGere um diagnóstico em 3-4 frases curtas em português.
Mencione os dados mais relevantes (fundamentos + contexto).
Se houver fato relevante CVM, dê destaque.
Se houver contradição (ex: fundamentos bons mas notícias negativas), destaque o conflito.
Não invente números. Use apenas os dados fornecidos.
NUNCA use linguagem de recomendação direta (compre, venda). Use linguagem descritiva: "momento favorável", "sinais de atenção", "fundamentos deteriorando".

Formato:
Forças (bullets com dados numéricos)
Atenção (bullets com dados numéricos)
Conclusão (1 frase descritiva, sem recomendação de compra/venda)`

  return prompt
}

function buildTemplateFallback(input: DiagnosisInput): string {
  const parts: string[] = []

  if (input.scoreTotal >= 70) {
    parts.push(`${input.ticker} apresenta fundamentos sólidos com score ${input.scoreTotal.toFixed(0)}.`)
  } else if (input.scoreTotal >= 50) {
    parts.push(`${input.ticker} tem perfil moderado com score ${input.scoreTotal.toFixed(0)}.`)
  } else {
    parts.push(`${input.ticker} requer atenção com score ${input.scoreTotal.toFixed(0)}.`)
  }

  if (input.fundamentals.roe != null && input.fundamentals.roe >= 15) {
    parts.push(`ROE de ${input.fundamentals.roe.toFixed(1)}% demonstra boa rentabilidade.`)
  }
  if (input.fundamentals.dividendYield != null && input.fundamentals.dividendYield >= 5) {
    parts.push(`DY de ${input.fundamentals.dividendYield.toFixed(1)}% oferece renda passiva atrativa.`)
  }

  // Contexto expandido no fallback (INT-10)
  if (input.recentNews?.hasRelevantFact && input.recentNews.relevantFactTitle) {
    parts.push(`Atenção: fato relevante CVM recente — "${input.recentNews.relevantFactTitle}".`)
  }
  if (input.dcfUpside != null) {
    if (input.dcfUpside >= 20) {
      parts.push(`DCF aponta upside de ${input.dcfUpside.toFixed(0)}%, sugerindo margem de segurança.`)
    } else if (input.dcfUpside < 0) {
      parts.push(`DCF indica downside de ${Math.abs(input.dcfUpside).toFixed(0)}%, atenção ao preço.`)
    }
  }
  if (input.cagedTrend?.trend === 'contracting') {
    parts.push(`Setor ${input.cagedTrend.sector} com tendência de demissões (CAGED).`)
  }
  if (input.portfolioContext?.exitAlerts && input.portfolioContext.exitAlerts.length > 0) {
    parts.push(`Alerta: ${input.portfolioContext.exitAlerts[0]}.`)
  }

  return parts.join(' ')
}

/**
 * Monta DiagnosisInput a partir de AssetData + contexto expandido (INT-10).
 */
export function assetToDiagnosisInput(
  asset: AssetData,
  context?: {
    news?: Array<{ title: string; sentiment?: number }>
    riEvents?: Array<{ title: string }>
    cagedData?: { trend: 'expanding' | 'stable' | 'contracting'; sector: string }
    portfolioContext?: { inPortfolios: string[]; exitAlerts: string[] }
    dcfUpside?: number | null
  },
): DiagnosisInput | null {
  if (!asset.aqScore || !asset.scoreBreakdown) return null

  const pilares = asset.scoreBreakdown.pilares
  const result: DiagnosisInput = {
    ticker: asset.ticker,
    name: asset.name,
    sector: asset.sector,
    price: asset.price,
    scoreTotal: asset.aqScore.scoreTotal,
    classificacao: asset.scoreBreakdown.classificacao,
    pillarScores: {
      valuation: pilares?.valuation?.nota ?? 0,
      quality: pilares?.qualidade?.nota ?? 0,
      risk: pilares?.risco?.nota ?? 0,
      dividends: pilares?.dividendos?.nota ?? 0,
      growth: pilares?.crescimento?.nota ?? 0,
    },
    fundamentals: {
      peRatio: asset.fundamentals.peRatio,
      roe: asset.fundamentals.roe,
      roic: asset.fundamentals.roic,
      dividendYield: asset.fundamentals.dividendYield,
      netDebtEbitda: asset.fundamentals.netDebtEbitda,
      margemLiquida: asset.fundamentals.margemLiquida,
    },
  }

  // Enriquecer com contexto expandido (INT-10)
  if (context?.news && context.news.length > 0) {
    const sentiments = context.news
      .filter(n => n.sentiment != null)
      .map(n => n.sentiment!)
    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      : 0

    const sorted = [...context.news].filter(n => n.sentiment != null)
      .sort((a, b) => (b.sentiment ?? 0) - (a.sentiment ?? 0))
    const topPositive = sorted.find(n => (n.sentiment ?? 0) > 0)
    const topNegative = [...sorted].reverse().find(n => (n.sentiment ?? 0) < 0)

    const hasRelevantFact = (context.riEvents?.length ?? 0) > 0
    const relevantFactTitle = context.riEvents?.[0]?.title

    result.recentNews = {
      count: context.news.length,
      avgSentiment,
      topPositive: topPositive?.title,
      topNegative: topNegative?.title,
      hasRelevantFact,
      relevantFactTitle,
    }
  } else if (context?.riEvents && context.riEvents.length > 0) {
    // RI sem news
    result.recentNews = {
      count: 0,
      avgSentiment: 0,
      hasRelevantFact: true,
      relevantFactTitle: context.riEvents[0]?.title,
    }
  }

  if (context?.cagedData) {
    result.cagedTrend = context.cagedData
  }

  if (context?.portfolioContext) {
    result.portfolioContext = context.portfolioContext
  }

  if (context?.dcfUpside !== undefined) {
    result.dcfUpside = context.dcfUpside ?? null
  }

  return result
}
