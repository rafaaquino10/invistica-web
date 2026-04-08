// ─── Alternative Signals ─────────────────────────────────────
// Ajustes de score baseados em dados alternativos (CAGED, etc.).
// Aditivo (±2-3pts), nunca multiplicativo.

export interface CAGEDSectorData {
  sector: string
  b3Sector: string
  month: string
  admissions: number
  dismissals: number
  netBalance: number
  trend: 'expanding' | 'stable' | 'contracting'
}

/**
 * Ajuste de score baseado no CAGED.
 * Emprego expandindo no setor → boost +2pts (leading indicator de receita).
 * Emprego contraindo → penalidade -2pts.
 */
export function cagedAdjustment(
  assetSector: string,
  cagedData: CAGEDSectorData[],
): { adjustment: number; reason: string | null } {
  const sectorData = cagedData.find(c => c.b3Sector === assetSector)
  if (!sectorData) return { adjustment: 0, reason: null }

  if (sectorData.trend === 'expanding') {
    return {
      adjustment: +2,
      reason: `CAGED: emprego expandindo em ${assetSector} (saldo +${sectorData.netBalance.toLocaleString('pt-BR')})`,
    }
  }

  if (sectorData.trend === 'contracting') {
    return {
      adjustment: -2,
      reason: `CAGED: emprego contraindo em ${assetSector} (saldo ${sectorData.netBalance.toLocaleString('pt-BR')})`,
    }
  }

  return { adjustment: 0, reason: null }
}

/**
 * Fetch CAGED data do gateway.
 */
export async function fetchCAGEDData(): Promise<CAGEDSectorData[]> {
  try {
    const gatewayUrl = process.env['INVESTIQ_API_URL'] || 'https://investiqbackend-production.up.railway.app'
    const res = await fetch(`${gatewayUrl}/v1/alternative/caged`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data ?? []
  } catch {
    return []
  }
}
