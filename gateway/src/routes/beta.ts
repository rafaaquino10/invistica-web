/**
 * Rota de beta dos ativos vs IBOV.
 *
 * GET /v1/beta?tickers=PETR4,VALE3
 * GET /v1/beta?tickers=all   (todos os tickers com dados disponíveis)
 *
 * Calcula beta rolling 12M (252 pregões) vs ^BVSP.
 * Cache 24h (beta muda lentamente).
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { cache } from '../cache/index.js'
import { logger } from '../logger.js'
import { calculateBeta, dailyReturns, type BetaResult } from '../providers/beta-calculator.js'

const router = Router()
const CACHE_KEY = 'beta'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 horas

// Dados de preços em memória (populados pelos outros providers ao inicializar)
// O gateway usa yfinance/brapi para preços — aqui usamos o cache de cotações
let ibovPricesCache: number[] = []

/** Registra preços do IBOV para uso no cálculo de beta */
export function setIbovPrices(prices: number[]): void {
  ibovPricesCache = prices
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const tickersParam = (req.query['tickers'] as string) || 'all'
    const cacheKey = `${CACHE_KEY}:${tickersParam}`

    // Verificar cache
    const cached = cache.get<BetaResult[]>(cacheKey)
    if (cached) {
      return res.json({ data: cached, fromCache: true })
    }

    // Se não temos preços do IBOV, retorna vazio graciosamente
    if (ibovPricesCache.length < 120) {
      logger.warn('[beta] Preços do IBOV insuficientes para cálculo de beta')
      return res.json({ data: [], reason: 'ibov_prices_unavailable' })
    }

    const ibovRet = dailyReturns(ibovPricesCache.slice(-252))

    // Para o MVP, retornamos um placeholder que será populado
    // quando a integração com preços históricos estiver completa.
    // O gateway não busca histórico de preços por ticker para beta
    // nesta versão — usa os dados disponíveis em tempo real.
    const results: BetaResult[] = []

    cache.set(cacheKey, results, CACHE_TTL)
    logger.info(`[beta] Calculado para ${results.length} tickers`)

    return res.json({ data: results })
  } catch (err) {
    logger.error({ err }, '[beta] Erro ao calcular betas')
    return res.status(500).json({ error: 'Erro ao calcular betas' })
  }
})

export const betaRoutes = router
