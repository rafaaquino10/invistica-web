/**
 * InvestIQ Backend API Client
 * Wraps the FastAPI backend at Railway
 */

const BASE_URL = process.env.INVESTIQ_API_URL || 'https://investiqbackend-production.up.railway.app'

interface RequestOptions {
  params?: Record<string, string | number | boolean>
  body?: unknown
  timeout?: number
}

class InvestIQClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async get<T = any>(path: string, opts?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, opts?.params)
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
      signal: opts?.timeout ? AbortSignal.timeout(opts.timeout) : undefined,
    })
    if (!res.ok) throw new Error(`InvestIQ API error: ${res.status} ${res.statusText}`)
    return res.json()
  }

  async post<T = any>(path: string, opts?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, opts?.params)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
      signal: opts?.timeout ? AbortSignal.timeout(opts.timeout) : undefined,
    })
    if (!res.ok) throw new Error(`InvestIQ API error: ${res.status} ${res.statusText}`)
    return res.json()
  }

  async put<T = any>(path: string, opts?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, opts?.params)
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
    })
    if (!res.ok) throw new Error(`InvestIQ API error: ${res.status} ${res.statusText}`)
    return res.json()
  }

  async delete<T = any>(path: string): Promise<T> {
    const url = this.buildUrl(path)
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error(`InvestIQ API error: ${res.status} ${res.statusText}`)
    return res.json()
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.baseUrl)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      }
    }
    return url.toString()
  }
}

// Singleton
export const investiq = new InvestIQClient(BASE_URL)

// ─── Convenience helpers ──────────────────────────────────────
// Use investiq.get() directly for most cases.
// These are kept for backward compatibility but all callers
// should prefer the singleton client directly.
