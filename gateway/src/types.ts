// ─── Shared Gateway Types ──────────────────────────────────────
// Canonical type definitions used across providers and routes.

/**
 * Fundamental indicator data for a single stock.
 * Source-agnostic: populated by CVM (primary), brapi modules (secondary), or both.
 */
export interface FundamentalData {
  ticker: string
  cotacao: number
  peRatio: number | null
  pbRatio: number | null
  psr: number | null
  dividendYield: number | null
  pAtivo: number | null
  pCapGiro: number | null
  pEbit: number | null
  pAtivCircLiq: number | null
  evEbit: number | null
  evEbitda: number | null
  margemEbit: number | null
  margemLiquida: number | null
  liquidezCorrente: number | null
  roic: number | null
  roe: number | null
  liq2meses: number | null
  patrimLiquido: number | null
  divBrutPatrim: number | null
  crescimentoReceita5a: number | null
  netDebtEbitda: number | null
  payout: number | null
  crescLucro5a: number | null
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  // FCF para Dividend Safety (FCF Coverage)
  freeCashflow: number | null
  ebitda: number | null
  // Trend Score: derivada temporal (positivo = melhorando, negativo = deteriorando)
  trendScore: number | null   // -2 a +2 pts
  roeMedia5a: number | null
  mrgLiquidaMedia5a: number | null

  // ─── Qualitative Metrics v2 ───────────────────────────────────
  // Bloco 1: Moat Score
  moatScore: number | null           // 0-100, vantagem competitiva
  moatClassification: 'wide' | 'narrow' | 'none' | null
  // Bloco 2: Earnings Quality
  earningsQuality: number | null     // 0-100, qualidade dos lucros
  accrualsRatio: number | null       // |accruals/ativo| — menor = melhor
  earningsManipulationFlag: boolean | null // true se suspeita de manipulação
  // Bloco 3: Management & Governance
  managementScore: number | null     // 0-100, qualidade da gestão
  // Bloco 4: Debt Sustainability
  debtSustainabilityScore: number | null  // 0-100, substitui Altman Z-Score
  // Bloco 5: Regulatory Risk
  regulatoryRiskScore: number | null // 0-100, risco regulatório
  // ─── Live Signals (Frente C) ──────────────────────────────────
  // Governance
  governanceScore: number | null       // 0-100, governança corporativa
  listingSegment: string | null        // "Novo Mercado", "Nível 1", etc.
  listingSegmentScore: number | null   // 0-100
  freeFloatScore: number | null        // 0-100
  cvmSanctionsScore: number | null     // 0-100 (0 sanções=100)
  // Live Management
  ceoTenureScore: number | null        // 0-100
  buybackSignal: number | null         // 80 se ativo, 40 se não
  newsSentimentScore: number | null    // 0-100 (50=neutro)
  // Regulatory Live
  catalystAlertScore: number | null    // 0-100 (0 alertas=100)
  riEventVolume: number | null         // Volume de comunicados 30d
  // Métricas detalhadas (para X-Ray e tooltips)
  fcfFromCvm: number | null          // FCF em BRL
  fcfYield: number | null            // FCF / Market Cap (%)
  fcfGrowthRate: number | null       // CAGR do FCF em 5 anos (%)
  fcfToNetIncome: number | null      // FCF / Lucro Líquido
  marginStability: number | null     // 0-100
  pricingPower: number | null        // Cresc. receita real acima IPCA (%)
  reinvestmentRate: number | null    // CapEx / Depreciação (real quando disponível)
  interestCoverage: number | null    // EBIT / Desp. Financeiras
  shortTermDebtRatio: number | null  // Dívida CP / Dívida Total
  debtCostEstimate: number | null    // Custo estimado da dívida (%)
}

/**
 * Company metadata (name, sector, subsector).
 * Sourced from CVM cadastro + brapi profile.
 */
export interface CompanyMetadata {
  ticker: string
  name: string
  setor: string
  subsetor: string
  setorOriginal: string
}
