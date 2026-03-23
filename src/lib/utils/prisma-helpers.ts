/**
 * ─── Prisma Type Serialization Helpers ───────────────────────
 *
 * Prisma retorna Decimal (string-like object) e BigInt para campos numéricos.
 * Estes helpers convertem para number nativo do JS para uso em tRPC responses.
 *
 * Uso: aplicar em TODOS os retornos de routers tRPC que incluem dados do Prisma.
 */

/**
 * Converte Prisma Decimal para number nativo.
 * Aceita Decimal, string, number, null e undefined.
 */
export function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber()
  }
  const num = Number(value)
  return isNaN(num) ? null : num
}

/**
 * Converte BigInt para number nativo.
 * Seguro para valores < Number.MAX_SAFE_INTEGER.
 */
export function bigintToNumber(value: bigint | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  return Number(value)
}

/**
 * Serializa um objeto inteiro, convertendo todos os campos Decimal/BigInt para number.
 * Usa duck-typing para detectar Decimal (tem .toNumber()) e BigInt (typeof === 'bigint').
 *
 * @param obj - Objeto do Prisma (ex: Transaction, Alert, Goal, etc.)
 * @returns Novo objeto com todos os campos numéricos como number nativo
 */
export function serializePrismaObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj }

  for (const key of Object.keys(result)) {
    const value = result[key]

    if (value === null || value === undefined) continue

    // Prisma Decimal → number
    if (typeof value === 'object' && value !== null && 'toNumber' in value) {
      ;(result as Record<string, unknown>)[key] = (value as { toNumber: () => number }).toNumber()
      continue
    }

    // BigInt → number
    if (typeof value === 'bigint') {
      ;(result as Record<string, unknown>)[key] = Number(value)
      continue
    }

    // Date permanece como Date (superjson serializa corretamente)
  }

  return result
}

/**
 * Serializa um array de objetos Prisma.
 */
export function serializePrismaArray<T extends Record<string, unknown>>(arr: T[]): T[] {
  return arr.map(serializePrismaObject)
}
