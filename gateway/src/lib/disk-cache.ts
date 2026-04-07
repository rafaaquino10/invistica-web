/**
 * Cache em disco para dados de provedores externos.
 * Salva JSON no diretório gateway/data/ para recuperação após restarts.
 * Permite servir dados stale quando provedor indisponível.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Diretório de dados do gateway (persiste cache em disco)
const CACHE_DIR = join(process.cwd(), 'gateway', 'data')

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }
}

export interface DiskCacheEntry<T> {
  data: T
  savedAt: string  // ISO string
}

/**
 * Salva dados em disco com timestamp.
 */
export function saveToDisk<T>(key: string, data: T): void {
  try {
    ensureCacheDir()
    const entry: DiskCacheEntry<T> = { data, savedAt: new Date().toISOString() }
    const path = join(CACHE_DIR, `${key}.json`)
    writeFileSync(path, JSON.stringify(entry), 'utf-8')
  } catch {
    // Falha silenciosa — cache em disco é best-effort
  }
}

/**
 * Carrega dados do disco.
 *
 * @param key - Chave do cache (nome do arquivo sem .json)
 * @param maxAgeMs - Idade máxima em ms; null = aceitar qualquer idade
 * @returns Dados ou null se não existe / expirado
 */
export function loadFromDisk<T>(key: string, maxAgeMs?: number): T | null {
  try {
    const path = join(CACHE_DIR, `${key}.json`)
    if (!existsSync(path)) return null

    const raw = readFileSync(path, 'utf-8')
    const entry = JSON.parse(raw) as DiskCacheEntry<T>

    if (maxAgeMs !== undefined) {
      const age = Date.now() - new Date(entry.savedAt).getTime()
      if (age > maxAgeMs) return null
    }

    return entry.data
  } catch {
    return null
  }
}

/**
 * Retorna informações sobre uma entrada de cache.
 */
export function getDiskCacheInfo(key: string): { exists: boolean; ageMs: number | null; savedAt: string | null } {
  try {
    const path = join(CACHE_DIR, `${key}.json`)
    if (!existsSync(path)) return { exists: false, ageMs: null, savedAt: null }

    const raw = readFileSync(path, 'utf-8')
    const entry = JSON.parse(raw) as DiskCacheEntry<unknown>
    const ageMs = Date.now() - new Date(entry.savedAt).getTime()

    return { exists: true, ageMs, savedAt: entry.savedAt }
  } catch {
    return { exists: false, ageMs: null, savedAt: null }
  }
}
