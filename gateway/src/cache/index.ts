// ─── In-Memory Cache Layer with Stale-While-Revalidate ─────
// TTL-based cache for gateway responses with SWR support.
// No external dependencies — just a Map with expiration.

interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
}

// Track in-flight SWR revalidations to prevent stampede
const swrInFlight = new Set<string>()

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private hitCount = 0
  private missCount = 0

  /**
   * Get cached value. Returns null only if no entry exists at all.
   * Expired entries are returned as stale (for SWR pattern).
   * Use `getFresh()` to only get non-expired entries.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) {
      this.missCount++
      return null
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      this.missCount++
      return null
    }
    this.hitCount++
    return entry.data
  }

  /**
   * Get cached value even if stale (for SWR background revalidation).
   * Returns the data regardless of TTL, or null if key doesn't exist.
   */
  getStale<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    return entry.data
  }

  /**
   * Check if cache entry is expired but data still exists (stale).
   */
  isStale(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    return Date.now() > entry.expiresAt
  }

  /**
   * Get age of cache entry in milliseconds, or null if not cached.
   */
  getAge(key: string): number | null {
    const entry = this.store.get(key)
    if (!entry) return null
    return Date.now() - entry.createdAt
  }

  /**
   * SWR-aware get: returns stale data while triggering background revalidation.
   * @param key Cache key
   * @param ttlMs TTL for fresh data
   * @param staleMaxMs Maximum time to serve stale data (default: 6x TTL)
   * @param revalidateFn Async function to fetch fresh data
   * @returns Cached data (fresh or stale) or result of revalidateFn
   */
  async getOrRevalidate<T>(
    key: string,
    ttlMs: number,
    revalidateFn: () => Promise<T>,
    staleMaxMs?: number
  ): Promise<T> {
    const maxStale = staleMaxMs ?? ttlMs * 6
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    const now = Date.now()

    // 1. Fresh cache
    if (entry && now < entry.expiresAt) {
      this.hitCount++
      return entry.data
    }

    // 2. Stale but within max stale window — serve stale, revalidate in background
    if (entry && now < entry.createdAt + maxStale) {
      this.hitCount++
      if (!swrInFlight.has(key)) {
        swrInFlight.add(key)
        revalidateFn()
          .then(data => {
            this.set(key, data, ttlMs)
            console.log(`[SWR] Revalidated: ${key}`)
          })
          .catch(err => {
            console.error(`[SWR] Revalidation failed for ${key}:`, (err as Error).message)
          })
          .finally(() => { swrInFlight.delete(key) })
      }
      return entry.data
    }

    // 3. No cache or too stale — synchronous fetch
    this.missCount++
    try {
      const data = await revalidateFn()
      this.set(key, data, ttlMs)
      return data
    } catch (err) {
      // If we have any stale data at all, prefer it over error
      if (entry) {
        console.warn(`[SWR] Fetch failed for ${key}, serving expired cache`)
        return entry.data
      }
      throw err
    }
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    })
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return false
    }
    return true
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  /** Delete all keys matching a prefix */
  invalidatePrefix(prefix: string): number {
    let count = 0
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  clear(): void {
    this.store.clear()
  }

  /** Remove expired entries beyond stale window (call periodically) */
  prune(): number {
    const now = Date.now()
    let pruned = 0
    for (const [key, entry] of this.store.entries()) {
      // Keep stale entries for up to 1 hour for SWR fallback
      const staleLimit = entry.expiresAt + 60 * 60 * 1000
      if (now > staleLimit) {
        this.store.delete(key)
        pruned++
      }
    }
    return pruned
  }

  stats() {
    return {
      entries: this.store.size,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: this.hitCount + this.missCount > 0
        ? ((this.hitCount / (this.hitCount + this.missCount)) * 100).toFixed(1) + '%'
        : 'N/A',
      swrInFlight: swrInFlight.size,
    }
  }
}

// Singleton instance
export const cache = new MemoryCache()

// Auto-prune every 10 minutes
setInterval(() => {
  const pruned = cache.prune()
  if (pruned > 0) {
    console.log(`[cache] Pruned ${pruned} expired entries`)
  }
}, 10 * 60 * 1000)
