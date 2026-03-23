/**
 * Macro Regime Detector
 *
 * Detecta o regime macro com base em SELIC Real (SELIC - IPCA 12 meses).
 * Retorna pesos ajustados dos pilares para o motor aQ Score.
 *
 * Risk Off (SELIC Real > 6%): Juros reais elevados — RF domina.
 *   → Aumenta Risco e Dividendos, reduz Crescimento.
 * Risk On (SELIC Real < 3%): Juros reais baixos — RV favorecida.
 *   → Aumenta Crescimento e Valuation, reduz Risco.
 * Neutro: Pesos padrão.
 *
 * Fallback: quando IPCA = 0 ou não informado, usa SELIC nominal com
 * thresholds antigos (backward compatible).
 */

export type MacroRegime = 'risk_on' | 'neutral' | 'risk_off'

export interface RegimePillarWeights {
  valuation: number
  quality: number
  risk: number
  dividends: number
  growth: number
}

export interface RegimeConfig {
  regime: MacroRegime
  pillarWeights: RegimePillarWeights
  description: string
  selicReal: number   // SELIC Real calculada (NaN quando usando fallback nominal)
  inputSelic: number  // Valor de SELIC utilizado
  inputIpca: number   // Valor de IPCA utilizado
}

// Risk Off (Selic Real >6%): juros reais altos massacram empresas endividadas.
// Risco e Dividendos dominam — crescimento é irrelevante com desconto alto.
const RISK_OFF_CONFIG = (selic: number, ipca: number, selicReal: number): RegimeConfig => ({
  regime: 'risk_off',
  pillarWeights: { valuation: 0.18, quality: 0.20, risk: 0.27, dividends: 0.25, growth: 0.10 },
  description: 'Juros reais elevados — foco em solidez, baixo endividamento e dividendos',
  selicReal,
  inputSelic: selic,
  inputIpca: ipca,
})

// Risk On (Selic Real <3%): ambiente estimulativo (ex: 2019-2020 SELIC 2-4.5%).
// Growth domina — empresas de crescimento são as maiores beneficiadas por juros baixos.
const RISK_ON_CONFIG = (selic: number, ipca: number, selicReal: number): RegimeConfig => ({
  regime: 'risk_on',
  pillarWeights: { valuation: 0.25, quality: 0.18, risk: 0.12, dividends: 0.10, growth: 0.35 },
  description: 'Juros reais baixos — foco em crescimento e valuation de longo prazo',
  selicReal,
  inputSelic: selic,
  inputIpca: ipca,
})

// Neutral: pesos padrão do engine sem ajuste de regime.
const NEUTRAL_CONFIG = (selic: number, ipca: number, selicReal: number): RegimeConfig => ({
  regime: 'neutral',
  pillarWeights: { valuation: 0.25, quality: 0.25, risk: 0.20, dividends: 0.15, growth: 0.15 },
  description: 'Regime neutro — pesos equilibrados',
  selicReal,
  inputSelic: selic,
  inputIpca: ipca,
})

/**
 * Detecta o regime macro atual a partir das taxas SELIC, IPCA e volatilidade IBOV.
 *
 * Sinal primário: SELIC Real (SELIC - IPCA)
 *   - risk_off: SELIC Real > 6%
 *   - risk_on:  SELIC Real < 3%
 *   - neutral:  3% ≤ SELIC Real ≤ 6%
 *
 * Sinal secundário (override): Volatilidade realizada 30d do IBOV
 *   - Se vol30d > 30% → force risk_off (mercado em stress)
 *   - Se vol30d < 12% → reforça risk_on (baixa volatilidade)
 *
 * Quando IPCA = 0 ou ausente, usa fallback de SELIC nominal.
 *
 * @param selic   - Taxa SELIC atual (ex.: 13.75 para 13.75%)
 * @param ipca    - IPCA 12 meses (ex.: 4.1 para 4.1%); default 0 = fallback nominal
 * @param vol30d  - Volatilidade realizada 30d do IBOV em % (ex.: 22.5); default 0 = sem dado
 */
export function detectRegime(selic: number, ipca: number = 0, vol30d: number = 0): RegimeConfig {
  const useReal = ipca > 0
  const selicReal = useReal ? selic - ipca : NaN

  // Override por volatilidade extrema
  if (vol30d > 30) {
    return RISK_OFF_CONFIG(selic, ipca, useReal ? selicReal : NaN)
  }

  if (useReal) {
    if (selicReal > 6.0) return RISK_OFF_CONFIG(selic, ipca, selicReal)
    if (selicReal < 3.0) return RISK_ON_CONFIG(selic, ipca, selicReal)
    // Se vol baixa e SELIC Real próxima do threshold risk_on, favorecer risk_on
    if (vol30d > 0 && vol30d < 12 && selicReal < 4.0) return RISK_ON_CONFIG(selic, ipca, selicReal)
    return NEUTRAL_CONFIG(selic, ipca, selicReal)
  }

  // Fallback para SELIC nominal (backward compat)
  if (selic > 11.5) return RISK_OFF_CONFIG(selic, ipca, NaN)
  if (selic < 8) return RISK_ON_CONFIG(selic, ipca, NaN)
  return NEUTRAL_CONFIG(selic, ipca, NaN)
}

/**
 * Informações de exibição para cada regime.
 */
export const REGIME_DISPLAY: Record<MacroRegime, { label: string; color: string; emoji: string }> = {
  risk_off: { label: 'Risk Off', color: '#EF4444', emoji: '' },
  neutral:  { label: 'Neutro', color: '#EAB308', emoji: '' },
  risk_on:  { label: 'Risk On', color: '#22C55E', emoji: '' },
}
