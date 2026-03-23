// ─── Sector Sensitivity Lists ────────────────────────────────────
// Maps sectors to macro sensitivities for the dynamic macro factor.
// Used by macro-factor.ts to determine how macro conditions
// (interest rates, FX, commodities, cyclicality) affect each sector.

import type { Setor } from './aq-score'

// ─── Sensitivity Groups ─────────────────────────────────────────

/** Sectors negatively impacted by rising interest rates */
export const RATE_SENSITIVE_NEGATIVE: Setor[] = [
  'varejo_consumo',
  'construcao_civil',
  'transporte_logistica',
  'tecnologia',
  'educacao',
]

/** Sectors positively impacted by rising interest rates */
export const RATE_SENSITIVE_POSITIVE: Setor[] = [
  'bancos_financeiro',
  'seguradoras',
]

/** Export-oriented sectors that benefit from weaker BRL (stronger USD) */
export const FX_EXPORTERS: Setor[] = [
  'mineracao',
  'siderurgia',
  'papel_celulose',
  'petroleo_gas',
  'agro',
]

/** Import-dependent sectors that suffer from weaker BRL */
export const FX_IMPORTERS: Setor[] = [
  'transporte_logistica',
  'varejo_consumo',
  'tecnologia',
]

/** Sectors positively correlated with commodity prices */
export const COMMODITY_POSITIVE: Setor[] = [
  'mineracao',
  'petroleo_gas',
  'agro',
  'siderurgia',
  'papel_celulose',
]

/** Sectors negatively impacted by high commodity prices (cost pressure) */
export const COMMODITY_NEGATIVE: Setor[] = [
  'varejo_consumo',
  'industrial',
  'transporte_logistica',
]

/** Cyclical sectors — more sensitive to economic cycles */
export const CYCLICAL_SECTORS: Setor[] = [
  'varejo_consumo',
  'construcao_civil',
  'industrial',
  'transporte_logistica',
  'mineracao',
  'siderurgia',
]

/** Defensive sectors — less sensitive to economic cycles */
export const DEFENSIVE_SECTORS: Setor[] = [
  'utilities_energia',
  'saneamento',
  'saude',
  'telecom',
]

// ─── Helper ──────────────────────────────────────────────────────

/**
 * Check if a sector belongs to a sensitivity group.
 */
export function isSectorIn(sectorName: Setor, list: Setor[]): boolean {
  return list.includes(sectorName)
}
