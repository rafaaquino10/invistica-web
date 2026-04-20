// ─── Research Note Elite (Claude API) ────────────────────────
// Nota de pesquisa premium gerada por Claude Sonnet.
// Apenas para plano Elite. Mais detalhada que diagnóstico Haiku.

import { generateClaudeCompletion, isClaudeAvailable, IQ_SYSTEM_PROMPT } from './claude-client'
import { validateNarrative } from './guardrail'
import { logger } from '../utils/logger'

interface ResearchAsset {
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
  }
  fundamentals: {
    peRatio: number | null
    roe: number | null
    roic: number | null
    dividendYield: number | null
    netDebtEbitda: number | null
    margemLiquida: number | null
    margemEbit: number | null
    liquidezCorrente: number | null
  }
}

interface ResearchMacro {
  regime: string
  selicReal: number
}

// Cache para research notes (1h)
const noteCache = new Map<string, { note: string; cachedAt: number }>()
const NOTE_TTL = 60 * 60 * 1000

/**
 * Gera nota de pesquisa premium via Claude API.
 * Retorna null se API key não configurada ou falha.
 */
export async function generateResearchNote(
  asset: ResearchAsset,
  peers: ResearchAsset[],
  macro: ResearchMacro,
): Promise<string | null> {
  if (!isClaudeAvailable()) return null

  // Checar cache
  const cacheKey = `note:${asset.ticker}:${asset.scoreTotal.toFixed(0)}`
  const cached = noteCache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < NOTE_TTL) {
    return cached.note
  }

  try {
    const prompt = buildResearchPrompt(asset, peers, macro)

    const note = await generateClaudeCompletion(prompt, {
      model: 'sonnet',
      temperature: 0.3,
      maxTokens: 1000,
      systemPrompt: IQ_SYSTEM_PROMPT,
      timeoutMs: 30_000,
    })

    // Guardrail
    const validation = validateNarrative(note, {
      roe: asset.fundamentals.roe,
      roic: asset.fundamentals.roic,
      pl: asset.fundamentals.peRatio,
      dy: asset.fundamentals.dividendYield,
      score: asset.scoreTotal,
    })

    if (!validation.passed) {
      logger.warn(`Guardrail falhou para research note ${asset.ticker}`, { errors: validation.errors })
      return null
    }

    noteCache.set(cacheKey, { note, cachedAt: Date.now() })
    return note
  } catch (err) {
    logger.warn(`Research note falhou para ${asset.ticker}`, { error: String(err) })
    return null
  }
}

function buildResearchPrompt(
  asset: ResearchAsset,
  peers: ResearchAsset[],
  macro: ResearchMacro,
): string {
  const peersSummary = peers
    .slice(0, 5)
    .map(p => `  ${p.ticker}: Score ${p.scoreTotal.toFixed(0)}, P/L ${p.fundamentals.peRatio?.toFixed(1) ?? 'N/D'}, ROE ${p.fundamentals.roe?.toFixed(1) ?? 'N/D'}%, DY ${p.fundamentals.dividendYield?.toFixed(1) ?? 'N/D'}%`)
    .join('\n')

  const regimeLabel = macro.regime === 'risk_off'
    ? 'Juros Altos (Risk Off)'
    : macro.regime === 'risk_on'
      ? 'Juros Baixos (Risk On)'
      : 'Neutro'

  return `Você é um analista fundamentalista sênior brasileiro. Gere uma nota de pesquisa profissional e detalhada para o ativo abaixo. Use SOMENTE os dados fornecidos — jamais invente números.

═══ ATIVO ═══
${asset.ticker} — ${asset.name}
Setor: ${asset.sector}
Preço: R$ ${asset.price.toFixed(2)}
Invscore: ${asset.scoreTotal.toFixed(0)}/100 (${asset.classificacao})

═══ PILARES ═══
Valuation: ${asset.pillarScores.valuation.toFixed(0)}/100
Qualidade: ${asset.pillarScores.quality.toFixed(0)}/100
Risco: ${asset.pillarScores.risk.toFixed(0)}/100
Dividendos: ${asset.pillarScores.dividends.toFixed(0)}/100
Crescimento: ${asset.pillarScores.growth.toFixed(0)}/100

═══ INDICADORES ═══
P/L: ${asset.fundamentals.peRatio?.toFixed(1) ?? 'N/D'}
ROE: ${asset.fundamentals.roe?.toFixed(1) ?? 'N/D'}%
ROIC: ${asset.fundamentals.roic?.toFixed(1) ?? 'N/D'}%
Margem EBIT: ${asset.fundamentals.margemEbit?.toFixed(1) ?? 'N/D'}%
Margem Líquida: ${asset.fundamentals.margemLiquida?.toFixed(1) ?? 'N/D'}%
DY: ${asset.fundamentals.dividendYield?.toFixed(1) ?? 'N/D'}%
Dív.Líq/EBITDA: ${asset.fundamentals.netDebtEbitda?.toFixed(1) ?? 'N/D'}
Liquidez Corrente: ${asset.fundamentals.liquidezCorrente?.toFixed(2) ?? 'N/D'}

═══ PARES DO SETOR ═══
${peersSummary || '  Sem pares disponíveis'}

═══ MACRO ═══
Regime: ${regimeLabel}
SELIC Real: ${isNaN(macro.selicReal) ? 'N/D' : macro.selicReal.toFixed(1)}%

═══ FORMATO ═══
1. Resumo Executivo (2-3 frases)
2. Pontos Fortes (3 bullets com dados)
3. Pontos de Atenção (2-3 bullets com dados)
4. Posicionamento vs Pares (comparativo)
5. Conclusão (1 frase prescritiva)

Máximo 400 palavras. Linguagem profissional em português.`
}
