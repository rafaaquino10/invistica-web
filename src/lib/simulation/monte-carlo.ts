// ─── Monte Carlo Portfolio Simulation ────────────────────────
// Simula milhares de caminhos com retorno/volatilidade por ativo.
// PRNG com seed para reprodutibilidade.

export interface MonteCarloPosition {
  ticker: string
  weight: number
  expectedReturn: number  // anual, ex: 0.12 = 12%
  volatility: number      // anual, ex: 0.25 = 25%
}

export interface MonteCarloInput {
  initialValue: number
  monthlyContribution: number
  positions: MonteCarloPosition[]
  years: number
  simulations?: number  // default 1000
}

export interface YearlyPercentile {
  year: number
  p5: number
  p25: number
  p50: number
  p75: number
  p95: number
}

export interface FinalValueStats {
  mean: number
  median: number
  stdDev: number
  min: number
  max: number
  probPositive: number  // % simulações com retorno positivo
  probDoubling: number  // % que dobra patrimônio
}

export interface DrawdownStats {
  mean: number
  worst: number
  p95: number
}

export interface MonteCarloResult {
  yearlyData: YearlyPercentile[]
  finalValue: FinalValueStats
  maxDrawdown: DrawdownStats
  totalInvested: number
  simulations: number
}

// Seeded PRNG (Lehmer/Park-Miller) para reprodutibilidade
function createPRNG(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

// Box-Muller para distribuição normal
function createNormalRandom(rng: () => number) {
  return () => {
    const u1 = rng()
    const u2 = rng()
    return Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2)
  }
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]!
}

/**
 * Executa simulação Monte Carlo para portfólio.
 */
export function runMonteCarlo(input: MonteCarloInput): MonteCarloResult {
  const { initialValue, monthlyContribution, positions, years } = input
  const simulations = input.simulations ?? 1000
  const months = years * 12

  const rng = createPRNG(42)
  const normalRandom = createNormalRandom(rng)

  // Retorno e volatilidade ponderados do portfólio
  const totalWeight = positions.reduce((s, p) => s + p.weight, 0) || 1
  const portfolioAnnualReturn = positions.reduce((s, p) => s + (p.weight / totalWeight) * p.expectedReturn, 0)
  const portfolioAnnualVol = positions.reduce((s, p) => s + (p.weight / totalWeight) * p.volatility, 0)

  // Converter para mensal
  const monthlyReturn = portfolioAnnualReturn / 12
  const monthlyVol = portfolioAnnualVol / Math.sqrt(12)

  // Snapshots anuais por simulação
  const annualSnapshots: number[][] = Array.from({ length: simulations }, () => [])
  const finalValues: number[] = []
  const maxDrawdowns: number[] = []

  for (let sim = 0; sim < simulations; sim++) {
    let value = initialValue
    let peak = initialValue
    let worstDrawdown = 0

    annualSnapshots[sim]!.push(value)

    for (let m = 1; m <= months; m++) {
      const shock = normalRandom()
      const ret = monthlyReturn + monthlyVol * shock
      value = value * (1 + ret) + monthlyContribution
      value = Math.max(value, 0) // Não pode ser negativo

      // Track peak e drawdown
      if (value > peak) peak = value
      const dd = peak > 0 ? (peak - value) / peak : 0
      if (dd > worstDrawdown) worstDrawdown = dd

      // Snapshot anual
      if (m % 12 === 0) {
        annualSnapshots[sim]!.push(value)
      }
    }

    finalValues.push(value)
    maxDrawdowns.push(worstDrawdown)
  }

  // Calcular percentis por ano
  const yearlyData: YearlyPercentile[] = []
  for (let y = 0; y <= years; y++) {
    const values = annualSnapshots.map(s => s[y] ?? 0).sort((a, b) => a - b)
    yearlyData.push({
      year: y,
      p5: percentile(values, 0.05),
      p25: percentile(values, 0.25),
      p50: percentile(values, 0.50),
      p75: percentile(values, 0.75),
      p95: percentile(values, 0.95),
    })
  }

  // Stats do valor final
  const sortedFinal = [...finalValues].sort((a, b) => a - b)
  const mean = finalValues.reduce((s, v) => s + v, 0) / simulations
  const variance = finalValues.reduce((s, v) => s + (v - mean) ** 2, 0) / simulations
  const totalInvested = initialValue + monthlyContribution * months

  const finalValue: FinalValueStats = {
    mean,
    median: percentile(sortedFinal, 0.50),
    stdDev: Math.sqrt(variance),
    min: sortedFinal[0]!,
    max: sortedFinal[sortedFinal.length - 1]!,
    probPositive: finalValues.filter(v => v > totalInvested).length / simulations,
    probDoubling: finalValues.filter(v => v > initialValue * 2).length / simulations,
  }

  // Stats de drawdown
  const sortedDD = [...maxDrawdowns].sort((a, b) => a - b)
  const maxDrawdown: DrawdownStats = {
    mean: maxDrawdowns.reduce((s, v) => s + v, 0) / simulations,
    worst: sortedDD[sortedDD.length - 1]!,
    p95: percentile(sortedDD, 0.95),
  }

  return {
    yearlyData,
    finalValue,
    maxDrawdown,
    totalInvested,
    simulations,
  }
}

/**
 * Estima retorno esperado e volatilidade de um ativo a partir de dados fundamentais.
 */
export function estimateAssetParams(
  score: number,
  changePercent: number,
  dy: number | null,
  sector: string,
): { expectedReturn: number; volatility: number } {
  // Retorno esperado baseado em score + DY
  const baseReturn = 0.06 // CDI como base (~6% real)
  const scoreBonus = ((score - 50) / 50) * 0.08 // ±8% baseado no score
  const dyComponent = (dy ?? 0) / 100
  const expectedReturn = baseReturn + scoreBonus + dyComponent

  // Volatilidade baseada no setor e score
  const sectorVols: Record<string, number> = {
    'Bancos': 0.22,
    'Energia Elétrica': 0.20,
    'Saneamento': 0.18,
    'Tecnologia da Informação': 0.35,
    'Varejo': 0.32,
    'Mineração': 0.30,
    'Petróleo': 0.28,
    'Construção Civil': 0.30,
    'Saúde': 0.25,
  }
  const baseVol = sectorVols[sector] ?? 0.25
  // Score alto → vol levemente menor (empresa previsível)
  const volAdjust = score >= 70 ? 0.95 : score <= 40 ? 1.10 : 1.0
  const volatility = baseVol * volAdjust

  return {
    expectedReturn: Math.max(expectedReturn, 0),
    volatility: Math.max(volatility, 0.10),
  }
}
