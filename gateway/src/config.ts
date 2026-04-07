// ─── Gateway Configuration ─────────────────────────────────
// Centralized config for API keys, cache TTLs, and constants

import 'dotenv/config'

// ─── Validação de variáveis obrigatórias ─────────────────
function validateGatewayEnv() {
  const warnings: string[] = []
  const errors: string[] = []

  if (!process.env['BRAPI_TOKEN']) {
    errors.push('BRAPI_TOKEN não definida — provider brapi.dev não funcionará')
  }

  if (errors.length > 0) {
    console.error('❌ Variáveis de ambiente do gateway inválidas:')
    errors.forEach((e) => console.error(`   - ${e}`))
    // Em produção, falha fatal; em dev, apenas aviso
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error(`Gateway: variáveis obrigatórias ausentes: ${errors.join('; ')}`)
    }
  }

  if (warnings.length > 0) {
    warnings.forEach((w) => console.warn(`⚠️  ${w}`))
  }
}

export const config = {
  port: Number(process.env['PORT'] ?? 4000),

  // ─── Provider API Keys ─────────────────────────────────
  brapi: {
    token: process.env['BRAPI_TOKEN'] ?? '',
    baseUrl: 'https://brapi.dev',
    // Free tier: 100 req/min
    maxRequestsPerMinute: 100,
    // Batch up to ~35 tickers per request (URL length limit)
    batchSize: 35,
  },

  // ─── Cache TTLs (milliseconds) ─────────────────────────
  cache: {
    quotes: 5 * 60 * 1000,         // 5 min  — cotações
    fundamentals: 24 * 60 * 60 * 1000, // 24h — indicadores fundamentalistas
    history: 60 * 60 * 1000,        // 1h  — histórico de preços
    dividends: 24 * 60 * 60 * 1000, // 24h — dividendos
    companies: 7 * 24 * 60 * 60 * 1000, // 7 dias — dados de empresa
    macro: 60 * 60 * 1000,          // 1h  — indicadores macro
    momentum: 5 * 60 * 1000,        // 5 min — momentum signals
    focus: 6 * 60 * 60 * 1000,      // 6h  — BCB Focus (weekly publication)
  },

  // ─── CVM (Comissão de Valores Mobiliários) ────────────
  cvm: {
    // CVM data is quarterly — refresh every 120 days
    maxAgeDays: 120,
    // Daily check for new data (runs in background)
    checkIntervalMs: 24 * 60 * 60 * 1000, // 24h
  },
} as const

// Executa validação ao importar
validateGatewayEnv()
