// ─── Guardrail Anti-Alucinação ──────────────────────────────
// Verifica se números citados na narrativa IA batem com dados reais.
// Se divergir >5%, rejeita e usa fallback template.
// INT-10: Validação de fato relevante (anti-alucinação contextual).

export interface GuardrailResult {
  passed: boolean
  errors: string[]
}

export interface GuardrailContext {
  hasRelevantFact?: boolean
}

const INDICATOR_MAP: Record<string, string> = {
  roe: 'roe',
  roic: 'roic',
  'p/l': 'pl',
  pl: 'pl',
  dy: 'dy',
  'dividend yield': 'dy',
  score: 'score',
  'dív/ebitda': 'divEbitda',
  'div/ebitda': 'divEbitda',
  'p/vp': 'pvp',
  'margem líquida': 'margemLiquida',
  'margem ebit': 'margemEbit',
}

function mapIndicatorToKey(indicator: string): string | undefined {
  const normalized = indicator.toLowerCase().trim()
  return INDICATOR_MAP[normalized]
}

/**
 * Valida que números citados na narrativa IA estão dentro da tolerância.
 * INT-10: Também valida menções a fato relevante contra dados reais.
 */
export function validateNarrative(
  narrative: string,
  realData: Record<string, number | null | undefined>,
  context?: GuardrailContext,
  tolerance: number = 0.05,
): GuardrailResult {
  const errors: string[] = []

  // Extrair padrões como "ROE de 21.3%", "P/L 13.5", "Score 72"
  const numberPattern = /([\w/\sÍí]+?)\s+(?:de\s+)?(\d+[.,]\d+)%?/gi
  let match
  while ((match = numberPattern.exec(narrative)) !== null) {
    const [, indicator, valueStr] = match
    if (!indicator || !valueStr) continue

    const narrativeValue = parseFloat(valueStr.replace(',', '.'))
    const key = mapIndicatorToKey(indicator)
    if (!key) continue

    const realValue = realData[key]
    if (realValue == null) continue

    const denominator = Math.abs(realValue) || 1
    const diff = Math.abs(narrativeValue - realValue) / denominator

    if (diff > tolerance) {
      errors.push(`${indicator.trim()}: narrativa diz ${narrativeValue}, real é ${realValue}`)
    }
  }

  // INT-10: Se texto menciona "fato relevante" mas não há fato relevante no input, rejeitar
  if (context) {
    const mentionsFact = /fato\s+relevante/i.test(narrative)
    if (mentionsFact && !context.hasRelevantFact) {
      errors.push('Narrativa menciona fato relevante CVM, mas nenhum fato relevante existe nos dados')
    }
  }

  return { passed: errors.length === 0, errors }
}
