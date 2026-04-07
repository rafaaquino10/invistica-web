import * as Sentry from '@sentry/node'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { config } from './config.js'
import { cache } from './cache/index.js'
import { getRateLimitStatus } from './providers/brapi-client.js'
import { ensureDataDir } from './persistence/index.js'
import { logger } from './logger.js'

// Initialize Sentry (no-op if DSN not configured)
if (process.env['SENTRY_DSN']) {
  Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    environment: process.env['NODE_ENV'] || 'development',
  })
  logger.info('Sentry initialized for gateway')
}

// ─── Providers (external API adapters) ───────────────────
import { fetchBcbIndicators } from './providers/bcb.js'

// ─── Normalized Routes (what Next.js consumes) ──────────
import { quotesRoutes, warmQuotesCache } from './routes/quotes.js'
import {
  unifiedFundamentalsRoutes,
  warmUnifiedCache,
  refreshUnifiedCache,
} from './routes/fundamentals-unified.js'
import { historyRoutes } from './routes/history.js'
import { dividendsRoutes } from './routes/dividends.js'
import { companiesRoutes } from './routes/companies.js'
import {
  newsRoutes,
  warmNewsCache,
  isNewsStale,
  refreshNews,
} from './routes/news.js'
import { benchmarksRoutes } from './routes/benchmarks.js'
import { modulesRoutes } from './routes/modules.js'
import { economyRoutes } from './routes/economy.js'
import { scoresRoutes } from './routes/scores.js'
import { momentumRoutes } from './routes/momentum.js'
import { intelligenceRoutes } from './routes/intelligence.js'
import { companyProfilesRoutes } from './routes/company-profiles.js'
import { betaRoutes } from './routes/beta.js'
import { getDiskCacheInfo } from './lib/disk-cache.js'
import { circuitBreaker } from './lib/failover.js'
import { cvmFundamentalsRoutes, warmCvmCache, isCvmStale } from './routes/fundamentals-cvm.js'
import { refreshCvmData, loadCvmData } from './providers/cvm-financials-client.js'
import {
  loadModulesMap,
  scrapeNewModules,
  isModulesStale,
  rescrapeAllModules,
} from './providers/modules-client.js'
import { adminRoutes } from './routes/admin.js'
import { riRoutes } from './routes/ri.js'
import { warmRiCache, isRiStale, fetchCvmRiEvents } from './providers/cvm-ri-client.js'
import alternativeDataRoutes from './routes/alternative-data.js'
import { sparklinesRoutes, warmSparklinesCache, isSparklinesStale, scrapeSparklines } from './routes/sparklines.js'
import { qualitativeRoutes, warmQualitativeCache, refreshQualitativeCache } from './routes/qualitative.js'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger.js'
import { warmCagedCache, fetchCAGEDData } from './providers/caged-client.js'
import { refreshB3Governance, isGovernanceStale, setKnownTickers } from './providers/b3-governance-client.js'
import { refreshLiveSignals, warmLiveSignalsCache } from './providers/live-signals-client.js'
import { enrichRiDocuments } from './providers/cvm-ri-client.js'
import { recordDailyVolume, getVolumeDataDays } from './providers/volume-accumulator.js'
import type { FundamentalData } from './types.js'

const app = express()

// ─── Middleware ───────────────────────────────────────────

// CORS: restrict to allowed origins in production
const allowedOrigins = (process.env['ALLOWED_ORIGINS'] || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without origin (server-to-server, curl, health checks)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`))
    }
  },
  credentials: true,
}))

app.use(express.json())

// Rate limiting: global 300 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded', retryAfter: 60 },
  validate: { xForwardedForHeader: false },
})

// Stricter rate limiting for heavy/scraping endpoints
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded for heavy endpoint', retryAfter: 60 },
  validate: { xForwardedForHeader: false },
})

app.use('/v1/', globalLimiter)
app.use('/v1/fundamentals', heavyLimiter)
app.use('/v1/modules', heavyLimiter)

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, path: req.path }, 'request')
  next()
})

// ─── Health & Status ─────────────────────────────────────

// Track provider health
const providerHealth: Record<string, { lastSuccess: number; lastError: string | null; status: 'ok' | 'degraded' | 'down' }> = {
  brapi: { lastSuccess: 0, lastError: null, status: 'ok' },
  cvm: { lastSuccess: 0, lastError: null, status: 'ok' },
  bcb: { lastSuccess: 0, lastError: null, status: 'ok' },
}

export function markProviderSuccess(provider: string) {
  const p = providerHealth[provider]
  if (p) { p.lastSuccess = Date.now(); p.lastError = null; p.status = 'ok' }
}

export function markProviderError(provider: string, error: string) {
  const p = providerHealth[provider]
  if (p) {
    p.lastError = error
    // Down if no success in last hour
    p.status = p.lastSuccess > 0 && (Date.now() - p.lastSuccess) < 60 * 60 * 1000 ? 'degraded' : 'down'
  }
}

function formatAge(ms: number | null): string {
  if (!ms) return 'never'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h${minutes % 60}m`
}

function getCacheHealth(key: string) {
  const age = cache.getAge(key)
  const isStale = cache.isStale(key)
  const staleData = cache.getStale<unknown[]>(key)
  return {
    exists: !!staleData,
    age: age ? Math.floor(age / 1000) : null,
    ageFormatted: formatAge(age),
    stale: isStale,
    itemCount: Array.isArray(staleData) ? staleData.length : (staleData ? 1 : 0),
  }
}

app.get('/health', (_req, res) => {
  const mem = process.memoryUsage()

  const caches = {
    quotes: getCacheHealth('quotes:all'),
    fundamentals: getCacheHealth('fundamentals-unified:all'),
    news: getCacheHealth('news:all'),
    modules: getCacheHealth('modules:all'),
    cvmFundamentals: getCacheHealth('fundamentals-cvm:all'),
    benchmarks: getCacheHealth('benchmarks'),
  }

  // Determine overall status
  const criticalDown = providerHealth['brapi']?.status === 'down' && providerHealth['cvm']?.status === 'down'
  const anyDegraded = Object.values(providerHealth).some(p => p.status !== 'ok')
  const overallStatus = criticalDown ? 'down' : anyDegraded ? 'degraded' : 'ok'

  res.status(overallStatus === 'down' ? 503 : 200).json({
    status: overallStatus,
    service: 'investiq-gateway',
    version: '3.0.0',
    uptime: Math.floor(process.uptime()),
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      unit: 'MB',
    },
    providers: Object.fromEntries(
      Object.entries(providerHealth).map(([name, p]) => [name, {
        status: p.status,
        lastSuccess: p.lastSuccess > 0 ? new Date(p.lastSuccess).toISOString() : null,
        lastSuccessAge: p.lastSuccess > 0 ? formatAge(Date.now() - p.lastSuccess) : 'never',
        lastError: p.lastError,
      }])
    ),
    brapi: {
      configured: !!config.brapi.token,
      rateLimit: getRateLimitStatus(),
    },
    rateLimiting: {
      enabled: true,
      globalLimit: '300/min',
      heavyLimit: '30/min',
    },
    cors: {
      allowedOrigins,
    },
    volumeAccumulator: {
      daysOfData: getVolumeDataDays(),
    },
    caches,
    cacheStats: cache.stats(),
    circuitBreakers: Object.fromEntries(
      Object.entries(circuitBreaker.getStatus()).map(([name, state]) => [name, {
        isOpen: state.isOpen,
        consecutiveFailures: state.failures,
        openedAt: state.openedAt,
        lastFailure: state.lastFailure,
      }])
    ),
    diskCache: {
      quotes:      getDiskCacheInfo('quotes'),
      benchmarks:  getDiskCacheInfo('benchmarks'),
      cvm:         getDiskCacheInfo('cvm-fundamentals'),
    },
    timestamp: new Date().toISOString(),
  })
})

// ─── Swagger / API Docs ──────────────────────────────────
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'InvestIQ Gateway — API Docs',
}))
app.get('/docs/json', (_req, res) => res.json(swaggerSpec))

// ─── Normalized Routes (v1) ──────────────────────────────
// These are the endpoints the Next.js app should consume.
// Unified format, cached, with fallback.
app.use('/v1/quotes', quotesRoutes)
app.use('/v1/fundamentals', unifiedFundamentalsRoutes)
app.use('/v1/history', historyRoutes)
app.use('/v1/dividends', dividendsRoutes)
app.use('/v1/companies', companiesRoutes)
app.use('/v1/companies', companyProfilesRoutes)
app.use('/v1/news', newsRoutes)
app.use('/v1/benchmarks', benchmarksRoutes)
app.use('/v1/modules', modulesRoutes)
app.use('/v1/economy', economyRoutes)
app.use('/v1/fundamentals-cvm', cvmFundamentalsRoutes)
app.use('/v1/scores', scoresRoutes)
app.use('/v1/momentum', momentumRoutes)
app.use('/v1/intelligence', intelligenceRoutes)
app.use('/v1/beta', betaRoutes)
app.use('/v1/admin', adminRoutes)
app.use('/v1/ri', riRoutes)
app.use('/v1/alternative', alternativeDataRoutes)
app.use('/v1/sparklines', sparklinesRoutes)
app.use('/v1/qualitative', qualitativeRoutes)

// ─── 404 Handler ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  })
})

// ─── Error Handler ───────────────────────────────────────
// Sentry error handler (captures errors before our custom handler)
if (process.env['SENTRY_DSN']) {
  Sentry.setupExpressErrorHandler(app)
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Gateway error')
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  })
})

// ─── Background Refresh ─────────────────────────────────
// Runs after the server is already listening with cached data.

async function backgroundRefresh() {
  try {
    // 1. Refresh financial modules (brapi ?modules=) if stale
    const existingModules = loadModulesMap()
    interface CachedQuote { stock: string; close: number; market_cap: number }
    let quotesCache = cache.getStale<CachedQuote[]>('quotes:all')

    // If no quotes cache, fetch them first (needed for modules scrape + CVM indicators)
    if (!quotesCache?.length) {
      logger.info('[startup] No quotes cache — fetching quotes from brapi...')
      const { fetchQuotesList } = await import('./providers/brapi-client.js')
      const freshQuotes = await fetchQuotesList()
      if (freshQuotes.length > 0) {
        cache.set('quotes:all', freshQuotes, config.cache.quotes)
        quotesCache = freshQuotes as unknown as CachedQuote[]
        logger.info(`[startup] Quotes cache populated: ${freshQuotes.length} stocks`)
      }
    }

    if (isModulesStale()) {
      logger.info('[startup] Modules data stale, fetching tickers...')
      if (quotesCache?.length) {
        // Sort by market cap descending — fetch most important tickers first
        // Limit to top 80 to stay within brapi rate limits (2 req/ticker × 2s delay = ~5min)
        const sorted = [...quotesCache].sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0))
        const topTickers = sorted.slice(0, 80).map(q => q.stock)
        const allTickers = quotesCache.map(q => q.stock)
        const priceMap = new Map<string, number>()
        const marketCapMap = new Map<string, number>()
        for (const q of quotesCache) {
          if (q.close > 0) priceMap.set(q.stock, q.close)
          if (q.market_cap > 0) marketCapMap.set(q.stock, q.market_cap)
        }
        logger.info(`[startup] Fetching modules for top ${topTickers.length} tickers by market cap (of ${allTickers.length} total)`)
        await scrapeNewModules(topTickers, new Map(), priceMap, marketCapMap)
        logger.info(`[startup] Modules refreshed`)
      }
    } else {
      // Incremental: scrape any tickers missing from modules
      if (quotesCache?.length) {
        const allTickers = quotesCache.map(q => q.stock)
        const newTickers = allTickers.filter(t => !existingModules.has(t))
        if (newTickers.length > 0) {
          logger.info(`[startup] Found ${newTickers.length} tickers without module data...`)
          const priceMap = new Map<string, number>()
          const marketCapMap = new Map<string, number>()
          for (const q of quotesCache) {
            if (q.close > 0) priceMap.set(q.stock, q.close)
            if (q.market_cap > 0) marketCapMap.set(q.stock, q.market_cap)
          }
          await scrapeNewModules(allTickers, existingModules, priceMap, marketCapMap)
        }
      }
    }

    // 2. Record daily volume snapshot for liq2meses accumulator
    interface VolumeQuote { stock: string; close: number; volume: number }
    const quotesForVolume = cache.getStale<VolumeQuote[]>('quotes:all')
    if (quotesForVolume?.length) {
      const volumeData = quotesForVolume
        .filter(q => q.volume > 0 && q.close > 0)
        .map(q => ({ ticker: q.stock, volume: q.volume, price: q.close }))
      recordDailyVolume(volumeData)
    }

    // 3. Refresh CVM data if stale (> 120 days)
    if (isCvmStale()) {
      logger.info('[startup] CVM data stale, starting refresh...')
      try {
        // Build known tickers from companies cache (best names) + quotes cache
        const knownTickers = new Map<string, string>()
        // Companies cache has full names (e.g., "PETROBRAS PN")
        const { readJsonFile } = await import('./persistence/index.js')
        interface CompanyEntry { ticker: string; name: string }
        const companiesFile = readJsonFile<{ companies: Record<string, CompanyEntry> }>('companies.json')
        if (companiesFile?.companies) {
          for (const [ticker, info] of Object.entries(companiesFile.companies)) {
            if (info.name && info.name !== ticker) {
              knownTickers.set(ticker, info.name)
            }
          }
        }
        // Fill gaps from quotes cache
        const quotesForCvm = cache.getStale<{ stock: string; name?: string }[]>('quotes:all')
        if (quotesForCvm) {
          for (const q of quotesForCvm) {
            if (!knownTickers.has(q.stock)) {
              knownTickers.set(q.stock, q.name ?? q.stock)
            }
          }
        }
        if (knownTickers.size > 0) {
          await refreshCvmData(knownTickers)
          markProviderSuccess('cvm')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        markProviderError('cvm', msg)
        logger.error({ err }, 'CVM refresh failed')
      }
    } else {
      const cvmData = loadCvmData()
      if (cvmData) markProviderSuccess('cvm')
    }

    // 4. Build qualitative metrics FIRST (needed by unified merge)
    const qualitative = refreshQualitativeCache()
    if (qualitative.length > 0) {
      logger.info(`[startup] Qualitative metrics built: ${qualitative.length} stocks`)
    }

    // 4b. Build unified fundamentals cache (CVM + modules + volume + qualitative)
    const unified = refreshUnifiedCache()
    if (unified.length > 0) {
      logger.info(`[startup] Unified fundamentals built: ${unified.length} stocks`)
    }

    // 5. Scrape sparklines (30d close prices) if stale
    if (isSparklinesStale() && quotesCache?.length) {
      logger.info('[startup] Sparklines stale, scraping 30d history...')
      // Pegar top 100 tickers por market cap (evitar scrape excessivo)
      const sortedTickers = [...quotesCache]
        .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
        .slice(0, 100)
        .map(q => q.stock)
      await scrapeSparklines(sortedTickers)
    }
  } catch (err) {
    logger.error({ err }, 'Background refresh error')
  }
}

// ─── Start ───────────────────────────────────────────────

// 1. Ensure data directory exists
ensureDataDir()

// 2. Warm caches from disk (synchronous, < 50ms)
// Order matters: quotes first → then unified (depends on quotes for rebuild)
const hadQuotes = warmQuotesCache()
const hadCvm = warmCvmCache()
const hadUnified = warmUnifiedCache()
const hadNews = warmNewsCache()
const hadRi = warmRiCache()
const hadCaged = warmCagedCache()
const hadSparklines = warmSparklinesCache()
const hadQualitative = warmQualitativeCache()
const hadLiveSignals = warmLiveSignalsCache()

// 3. Start listening immediately (data from disk available)
app.listen(config.port, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   InvestIQ Gateway  :${String(config.port).padEnd(5)}                              ║
║                                                              ║
║   Normalized Routes (v1):                                    ║
║   • GET  /v1/quotes?tickers=...         Cotações             ║
║   • GET  /v1/quotes/all                 Todas as cotações    ║
║   • GET  /v1/fundamentals?tickers=...   Indicadores          ║
║   • GET  /v1/fundamentals/all           Todos indicadores    ║
║   • GET  /v1/history/:ticker?range=1mo  Histórico OHLCV      ║
║   • GET  /v1/dividends/:ticker          Dividendos           ║
║   • GET  /v1/companies                  Metadados empresas   ║
║   • GET  /v1/companies/:ticker          Detalhe empresa      ║
║║   • GET  /v1/news?category=&limit=      Noticias RSS         ║
║   • GET  /v1/benchmarks                Selic/CDI/IBOV       ║
║   • GET  /v1/scores/history/:ticker    Score history        ║
║   • GET  /v1/scores/movers            Score movers         ║
║   • GET  /v1/scores/alerts            Score alerts         ║
║   • GET  /v1/alternative/caged       CAGED emprego        ║
║   Status:                                                    ║
║   • GET  /health                        Health check         ║
║   • GET  /docs                         Swagger UI           ║
║   • GET  /docs/json                    OpenAPI spec          ║
║                                                              ║
║   Data sources: CVM + brapi (zero scraping)                  ║
║   Quotes: ${hadQuotes ? 'From disk' : 'Will fetch'}                          ║
║   CVM: ${hadCvm ? 'From disk' : 'Will fetch'}                             ║
║   Unified: ${hadUnified ? 'From disk' : 'Will build'}                     ║
║   News: ${hadNews ? 'From disk' : 'Will fetch'}                          ║
║   RI/CVM: ${hadRi ? 'From disk' : 'Will fetch'}                          ║
║   CAGED: ${hadCaged ? 'From disk' : 'Will fetch'}                         ║
║   Sparklines: ${hadSparklines ? 'From disk' : 'Will scrape'}                    ║
║   Qualitative: ${hadQualitative ? 'From disk' : 'Will build'}                   ║
║   LiveSignals: ${hadLiveSignals ? 'From disk' : 'Will build'}                   ║
║   Volume accumulator: ${String(getVolumeDataDays()).padEnd(3)} days               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝`)

  // 4. Background refresh (non-blocking — server already accepts requests)
  backgroundRefresh()

  // 5. Periodic news refresh (every 10 minutes)
  setInterval(async () => {
    try {
      if (isNewsStale()) {
        await refreshNews()
      }
    } catch (err) {
      logger.error({ err }, 'News refresh error')
    }
  }, 10 * 60 * 1000)

  // 7. Periodic qualitative + unified fundamentals refresh (every 30 minutes)
  setInterval(() => {
    try {
      refreshQualitativeCache()  // Qualitative FIRST — unified reads it during merge
      refreshUnifiedCache()
      logger.info('[refresh] Qualitative + unified fundamentals cache rebuilt')
    } catch (err) {
      logger.error({ err }, 'Unified/qualitative fundamentals refresh error')
    }
  }, 30 * 60 * 1000)

  // 8. Initial news fetch (non-blocking)
  if (!hadNews) {
    refreshNews().catch(err => logger.error({ err }, 'News initial fetch error'))
  }

  // 9. Initial BCB indicators fetch (non-blocking)
  fetchBcbIndicators().catch(err => logger.error({ err }, 'BCB initial fetch error'))

  // 10. Periodic BCB refresh (every 1 hour)
  setInterval(async () => {
    try {
      await fetchBcbIndicators()
    } catch (err) {
      logger.error({ err }, 'BCB refresh error')
    }
  }, 60 * 60 * 1000)

  // 11. Initial RI/CVM fetch (non-blocking)
  if (!hadRi) {
    fetchCvmRiEvents().catch(err => logger.error({ err }, 'RI initial fetch error'))
  }

  // 12. Periodic RI/CVM refresh (every 2 hours)
  setInterval(async () => {
    try {
      if (isRiStale()) {
        await fetchCvmRiEvents()
      }
    } catch (err) {
      logger.error({ err }, 'RI refresh error')
    }
  }, 2 * 60 * 60 * 1000)

  // 13. Initial CAGED fetch (non-blocking)
  if (!hadCaged) {
    fetchCAGEDData().catch(err => logger.error({ err }, 'CAGED initial fetch error'))
  }

  // 14. Periodic CAGED refresh (every 24 hours)
  setInterval(async () => {
    try {
      await fetchCAGEDData()
      logger.info('[caged-job] CAGED data refreshed')
    } catch (err) {
      logger.error({ err }, 'CAGED refresh error')
    }
  }, 24 * 60 * 60 * 1000)

  // 15. B3 Governance refresh (weekly)
  if (isGovernanceStale()) {
    // Set known tickers for B3 mapping
    const quotesCache = cache.getStale<{stock:string}[]>('quotes:all')
    if (quotesCache?.length) {
      const tickerMap = new Map<string, string>()
      for (const q of quotesCache) tickerMap.set(q.stock, q.stock)
      setKnownTickers(tickerMap)
    }
    refreshB3Governance().catch(err => logger.error({ err }, 'B3 governance initial fetch error'))
  }
  setInterval(async () => {
    try {
      if (isGovernanceStale()) {
        await refreshB3Governance()
      }
    } catch (err) {
      logger.error({ err }, 'B3 governance refresh error')
    }
  }, 7 * 24 * 60 * 60 * 1000)

  // 16. News content enrichment (every 10 min, after news refresh)
  import('./routes/news.js').then(({ enrichNewsWithFullText }) => {
    setInterval(async () => {
      try {
        await enrichNewsWithFullText()
      } catch (err) {
        logger.error({ err }, 'News enrichment error')
      }
    }, 10 * 60 * 1000)
    // Initial enrichment
    enrichNewsWithFullText().catch(err => logger.error({ err }, 'News enrichment initial error'))
  }).catch(err => logger.error({ err }, 'News enrichment import error'))

  // 17. RI document enrichment (every 1h, after RI refresh)
  setInterval(async () => {
    try {
      await enrichRiDocuments()
    } catch (err) {
      logger.error({ err }, 'RI doc enrichment error')
    }
  }, 60 * 60 * 1000)
  // Initial enrichment
  enrichRiDocuments().catch(err => logger.error({ err }, 'RI doc enrichment initial error'))

  // 18. Live Signals refresh (every 15 min)
  setInterval(() => {
    try {
      refreshLiveSignals()
    } catch (err) {
      logger.error({ err }, 'Live signals refresh error')
    }
  }, 15 * 60 * 1000)
  // Initial build
  try { refreshLiveSignals() } catch { /* best effort */ }
})
