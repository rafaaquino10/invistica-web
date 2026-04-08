// ─── Safe Fetch Utility ──────────────────────────────────────
// Wraps API calls with logging and typed fallbacks.
// Replaces silent `.catch(() => [])` throughout the codebase.

/**
 * Safely execute an async operation with a typed fallback.
 * Logs errors for observability instead of silently swallowing.
 *
 * @example
 * const data = await safeFetch(() => investiq.get('/scores/top'), [], 'scores/top')
 */
export async function safeFetch<T>(
  fn: () => Promise<T>,
  fallback: T,
  label?: string,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[safeFetch]${label ? ` ${label}:` : ''} ${msg}`)
    return fallback
  }
}

/**
 * Safely execute multiple async operations in parallel.
 * Each operation gets its own fallback — one failure doesn't block others.
 *
 * @example
 * const [scores, regime] = await safeParallel([
 *   { fn: () => investiq.get('/scores/top'), fallback: [], label: 'top' },
 *   { fn: () => investiq.get('/analytics/regime'), fallback: null, label: 'regime' },
 * ])
 */
export async function safeParallel<T extends readonly unknown[]>(
  ops: { [K in keyof T]: { fn: () => Promise<T[K]>; fallback: T[K]; label?: string } }
): Promise<T> {
  const results = await Promise.allSettled(
    ops.map(op => op.fn())
  )
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    const op = ops[i]!
    console.warn(`[safeParallel]${op.label ? ` ${op.label}:` : ''} ${r.reason}`)
    return op.fallback
  }) as unknown as T
}
