// ─── JSON Persistence Layer ──────────────────────────────────
// Atomic read/write of JSON files to gateway/data/.
// Used for caching static and slow-changing data across restarts.

import { existsSync, mkdirSync, writeFileSync, readFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'

// gateway/data/ lives at the gateway package root.
// __dirname works in CJS (tsx transpiles to CJS since package.json has no "type":"module").
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DATA_DIR = join(__dirname, '..', '..', 'data')

/** Ensure gateway/data/ directory exists */
export function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
    console.log(`[persistence] Created data dir: ${DATA_DIR}`)
  }
}

/** Get absolute path for a file inside gateway/data/ */
export function getDataPath(filename: string): string {
  return join(DATA_DIR, filename)
}

/** Read and parse a JSON file. Returns null if file doesn't exist or is invalid. */
export function readJsonFile<T>(filename: string): T | null {
  const filepath = getDataPath(filename)
  try {
    if (!existsSync(filepath)) return null
    const raw = readFileSync(filepath, 'utf-8')
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`[persistence] Failed to read ${filename}:`, (err as Error).message)
    return null
  }
}

/**
 * Write data as JSON with atomic write (write to .tmp, then rename).
 * Prevents corruption if process crashes mid-write.
 */
export function writeJsonFile<T>(filename: string, data: T): void {
  ensureDataDir()
  const filepath = getDataPath(filename)
  const tmpPath = filepath + '.tmp'
  try {
    writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
    renameSync(tmpPath, filepath)
    console.log(`[persistence] Saved ${filename}`)
  } catch (err) {
    console.error(`[persistence] Failed to write ${filename}:`, (err as Error).message)
  }
}
