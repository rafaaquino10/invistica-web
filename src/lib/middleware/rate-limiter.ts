// ─── In-Memory Rate Limiter (Sliding Window) ─────────────────
// Rate limiting baseado em sliding window com Map por chave (IP ou userId).
// Adequado para single-instance (Vercel serverless tem limites naturais).
// Para multi-instance em produção, migrar para Upstash Redis.

interface RateLimitEntry {
  timestamps: number[]
}

interface RateLimitConfig {
  /** Máximo de requisições na janela */
  maxRequests: number
  /** Janela de tempo em milissegundos */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  /** Requisições restantes na janela */
  remaining: number
  /** Timestamp (ms) quando a janela mais antiga expira */
  resetAt: number
  /** Segundos até poder tentar novamente (0 se allowed) */
  retryAfterSeconds: number
}

// Presets para diferentes tipos de endpoint
export const RATE_LIMITS = {
  /** Endpoints públicos: 60 req/min por IP */
  public: { maxRequests: 60, windowMs: 60_000 } as RateLimitConfig,
  /** Endpoints protegidos: 120 req/min por userId */
  protected: { maxRequests: 120, windowMs: 60_000 } as RateLimitConfig,
  /** Mutations: 20 req/min por userId */
  mutation: { maxRequests: 20, windowMs: 60_000 } as RateLimitConfig,
  /** Premium: 180 req/min por userId */
  premium: { maxRequests: 180, windowMs: 60_000 } as RateLimitConfig,
} as const

class SlidingWindowRateLimiter {
  private buckets = new Map<string, RateLimitEntry>()
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // Limpeza periódica de entradas expiradas (a cada 5 min)
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60_000)
      // Não impedir Node de sair
      if (this.cleanupInterval && 'unref' in this.cleanupInterval) {
        (this.cleanupInterval as NodeJS.Timeout).unref()
      }
    }
  }

  /**
   * Verifica e registra uma requisição.
   * @param key Chave única (IP ou userId)
   * @param config Limites a aplicar
   */
  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const windowStart = now - config.windowMs

    let entry = this.buckets.get(key)
    if (!entry) {
      entry = { timestamps: [] }
      this.buckets.set(key, entry)
    }

    // Remove timestamps fora da janela
    entry.timestamps = entry.timestamps.filter(t => t > windowStart)

    if (entry.timestamps.length >= config.maxRequests) {
      // Rate limit excedido
      const oldestInWindow = entry.timestamps[0]!
      const resetAt = oldestInWindow + config.windowMs
      const retryAfterSeconds = Math.ceil((resetAt - now) / 1000)

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfterSeconds: Math.max(retryAfterSeconds, 1),
      }
    }

    // Registra a requisição
    entry.timestamps.push(now)

    return {
      allowed: true,
      remaining: config.maxRequests - entry.timestamps.length,
      resetAt: now + config.windowMs,
      retryAfterSeconds: 0,
    }
  }

  /** Remove entradas expiradas para liberar memória */
  private cleanup() {
    const now = Date.now()
    // Janela máxima entre todos os presets (60s)
    const maxWindow = 60_000

    for (const [key, entry] of this.buckets) {
      entry.timestamps = entry.timestamps.filter(t => now - t < maxWindow)
      if (entry.timestamps.length === 0) {
        this.buckets.delete(key)
      }
    }
  }

  /** Número de chaves rastreadas (para observabilidade) */
  get size() {
    return this.buckets.size
  }
}

// Singleton — compartilhado entre todas as requisições
export const rateLimiter = new SlidingWindowRateLimiter()
