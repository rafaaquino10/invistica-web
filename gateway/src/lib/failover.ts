/**
 * Sistema de failover para provedores de dados externos.
 *
 * Estratégia por provedor:
 * - brapi (quotes): fallback para cache em disco (stale > ausente)
 * - CVM (fundamentals): cache em disco TTL longo (dados trimestrais)
 * - BCB (SELIC/IPCA): cache em disco 24h + valores default conservadores
 * - RSS (news): graceful degradation (ocultar feature, não quebrar)
 *
 * Circuit Breaker: após N falhas consecutivas, abre o circuito e
 * redireciona imediatamente ao fallback sem tentar o provedor.
 * Após halfOpenAfterMs, permite 1 tentativa (half-open state).
 */

import { logger } from '../logger.js'

// ─── Tipos ──────────────────────────────────────────────────────────

export interface FailoverConfig {
  provider: string
  maxRetries: number
  retryDelayMs: number
  staleTTLMs: number
  circuitBreakerThreshold: number
  halfOpenAfterMs: number
}

export interface CircuitBreakerState {
  failures: number
  lastFailure: Date | null
  isOpen: boolean
  openedAt: Date | null
  halfOpenAfterMs: number
}

export type DataSource = 'live' | 'stale' | 'fallback' | 'unavailable'

// ─── Configurações por Provedor ──────────────────────────────────────

export const FAILOVER_CONFIGS: Record<string, FailoverConfig> = {
  brapi: {
    provider: 'brapi',
    maxRetries: 2,
    retryDelayMs: 1000,
    staleTTLMs: 4 * 60 * 60 * 1000,        // 4h stale aceitável para quotes
    circuitBreakerThreshold: 5,
    halfOpenAfterMs: 5 * 60 * 1000,         // Tentar novamente após 5 min
  },
  cvm: {
    provider: 'cvm',
    maxRetries: 1,
    retryDelayMs: 2000,
    staleTTLMs: 7 * 24 * 60 * 60 * 1000,   // 7 dias (dados trimestrais)
    circuitBreakerThreshold: 3,
    halfOpenAfterMs: 30 * 60 * 1000,        // Tentar após 30 min
  },
  bcb: {
    provider: 'bcb',
    maxRetries: 2,
    retryDelayMs: 500,
    staleTTLMs: 24 * 60 * 60 * 1000,       // 24h (SELIC muda max 8x/ano)
    circuitBreakerThreshold: 5,
    halfOpenAfterMs: 10 * 60 * 1000,        // Tentar após 10 min
  },
}

// ─── Circuit Breaker ─────────────────────────────────────────────────

class CircuitBreaker {
  private states = new Map<string, CircuitBreakerState>()

  private getState(provider: string): CircuitBreakerState {
    if (!this.states.has(provider)) {
      const config = FAILOVER_CONFIGS[provider]
      this.states.set(provider, {
        failures: 0,
        lastFailure: null,
        isOpen: false,
        openedAt: null,
        halfOpenAfterMs: config?.halfOpenAfterMs ?? 5 * 60 * 1000,
      })
    }
    return this.states.get(provider)!
  }

  recordFailure(provider: string): void {
    const state = this.getState(provider)
    const config = FAILOVER_CONFIGS[provider]
    state.failures++
    state.lastFailure = new Date()

    if (config && state.failures >= config.circuitBreakerThreshold && !state.isOpen) {
      state.isOpen = true
      state.openedAt = new Date()
      logger.warn(`[circuit-breaker] Circuito ABERTO para ${provider} após ${state.failures} falhas`)
    }
  }

  recordSuccess(provider: string): void {
    const state = this.getState(provider)
    if (state.isOpen) {
      logger.info(`[circuit-breaker] Circuito FECHADO para ${provider} — provedor recuperado`)
    }
    state.failures = 0
    state.lastFailure = null
    state.isOpen = false
    state.openedAt = null
  }

  /**
   * Retorna true se circuito está aberto (deve usar fallback).
   * Se aberto há mais de halfOpenAfterMs, permite 1 tentativa (half-open).
   */
  isOpen(provider: string): boolean {
    const state = this.getState(provider)
    if (!state.isOpen) return false

    // Verificar se passou tempo suficiente para half-open
    if (state.openedAt) {
      const elapsed = Date.now() - state.openedAt.getTime()
      if (elapsed > state.halfOpenAfterMs) {
        logger.info(`[circuit-breaker] Half-open para ${provider} — testando recuperação`)
        return false  // Permitir 1 tentativa
      }
    }

    return true
  }

  getStatus(): Record<string, CircuitBreakerState & { provider: string }> {
    const result: Record<string, CircuitBreakerState & { provider: string }> = {}
    for (const [provider, state] of this.states) {
      result[provider] = { ...state, provider }
    }
    return result
  }
}

export const circuitBreaker = new CircuitBreaker()

// ─── Utilitários ─────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── fetchWithFailover ───────────────────────────────────────────────

/**
 * Fetch com retry, circuit breaker e fallback para cache em disco.
 *
 * @param provider - Nome do provedor (chave em FAILOVER_CONFIGS)
 * @param fetchFn - Função que busca dados ao vivo
 * @param fallbackFn - Função de fallback (cache disco ou default)
 * @returns { data, source }
 */
export async function fetchWithFailover<T>(
  provider: string,
  fetchFn: () => Promise<T>,
  fallbackFn?: () => T | null,
): Promise<{ data: T | null; source: DataSource }> {
  const config = FAILOVER_CONFIGS[provider] ?? {
    maxRetries: 1, retryDelayMs: 1000, staleTTLMs: 0,
    circuitBreakerThreshold: 5, halfOpenAfterMs: 300_000,
  }

  // 1. Verificar circuit breaker
  if (circuitBreaker.isOpen(provider)) {
    logger.warn(`[failover] Circuito aberto para ${provider} — usando fallback direto`)
    if (fallbackFn) {
      const fallback = fallbackFn()
      if (fallback !== null) return { data: fallback, source: 'stale' }
    }
    return { data: null, source: 'unavailable' }
  }

  // 2. Tentar fetch com retry e backoff linear
  let lastError: unknown = null
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(config.retryDelayMs * attempt)
        logger.info(`[failover] Retry ${attempt}/${config.maxRetries} para ${provider}`)
      }
      const data = await fetchFn()
      circuitBreaker.recordSuccess(provider)
      return { data, source: 'live' }
    } catch (err) {
      lastError = err
    }
  }

  // 3. Todas as tentativas falharam
  circuitBreaker.recordFailure(provider)
  logger.error({ err: lastError }, `[failover] ${provider} indisponível após ${config.maxRetries + 1} tentativas`)

  // 4. Tentar fallback
  if (fallbackFn) {
    const fallback = fallbackFn()
    if (fallback !== null) {
      logger.warn(`[failover] ${provider} usando dados stale/fallback`)
      return { data: fallback, source: 'stale' }
    }
  }

  return { data: null, source: 'unavailable' }
}
