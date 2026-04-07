/**
 * Cálculo de beta rolling de um ativo vs IBOV.
 *
 * Beta = Cov(Ri, Rm) / Var(Rm)
 * Usa retornos diários dos últimos 12 meses (252 pregões).
 * Mínimo de 120 pregões (~6 meses) para resultado válido.
 */

export interface BetaResult {
  ticker: string
  beta: number
  rSquared: number   // Quão bem o beta explica a variação (R²)
  dataPoints: number // Pregões utilizados no cálculo
}

/**
 * Calcula beta e R² a partir de arrays de retornos diários.
 *
 * @param assetReturns - Retornos diários do ativo (já alinhados com ibovReturns)
 * @param ibovReturns  - Retornos diários do IBOV (benchmark)
 */
export function calculateBeta(
  assetReturns: number[],
  ibovReturns: number[],
): { beta: number; rSquared: number } {
  const n = Math.min(assetReturns.length, ibovReturns.length)
  if (n < 2) return { beta: 1.0, rSquared: 0 }

  const ra = assetReturns.slice(-n)
  const rm = ibovReturns.slice(-n)

  const meanRa = ra.reduce((a, b) => a + b, 0) / n
  const meanRm = rm.reduce((a, b) => a + b, 0) / n

  let cov = 0
  let varM = 0
  let varA = 0

  for (let i = 0; i < n; i++) {
    const da = ra[i]! - meanRa
    const dm = rm[i]! - meanRm
    cov += da * dm
    varM += dm * dm
    varA += da * da
  }

  cov /= n - 1
  varM /= n - 1
  varA /= n - 1

  if (varM === 0) return { beta: 1.0, rSquared: 0 }

  const beta = cov / varM
  // R² = cor² = cov² / (varA * varM)
  const rSquared = varA > 0 ? (cov * cov) / (varA * varM) : 0

  return {
    beta: Math.round(beta * 1000) / 1000,
    rSquared: Math.min(1, Math.max(0, Math.round(rSquared * 1000) / 1000)),
  }
}

/**
 * Calcula retornos diários percentuais de uma série de preços.
 */
export function dailyReturns(prices: number[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]!
    const curr = prices[i]!
    if (prev > 0) {
      returns.push((curr - prev) / prev)
    }
  }
  return returns
}
