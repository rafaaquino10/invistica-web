// ─── Sector Sensitivity Groups (Gateway Copy) ───────────────
// Minimal duplicate of src/lib/scoring/sector-sensitivity.ts
// for gateway independence. Keep in sync if sector list changes.

export const RATE_SENSITIVE_NEGATIVE = [
  'varejo_consumo', 'construcao_civil', 'transporte_logistica', 'tecnologia', 'educacao',
]

export const RATE_SENSITIVE_POSITIVE = [
  'bancos_financeiro', 'seguradoras',
]

export const FX_EXPORTERS = [
  'mineracao', 'siderurgia', 'papel_celulose', 'petroleo_gas', 'agro',
]

export const FX_IMPORTERS = [
  'transporte_logistica', 'varejo_consumo', 'tecnologia',
]

export const COMMODITY_POSITIVE = [
  'mineracao', 'petroleo_gas', 'agro', 'siderurgia', 'papel_celulose',
]

export const COMMODITY_NEGATIVE = [
  'varejo_consumo', 'industrial', 'transporte_logistica',
]

export const CYCLICAL_SECTORS = [
  'varejo_consumo', 'construcao_civil', 'industrial', 'transporte_logistica', 'mineracao', 'siderurgia',
]

export const DEFENSIVE_SECTORS = [
  'utilities_energia', 'saneamento', 'saude', 'telecom',
]

export function isSectorIn(sectorName: string, list: string[]): boolean {
  const normalized = sectorName.toLowerCase().replace(/[\s/]+/g, '_')
  return list.some(s => normalized.includes(s) || s.includes(normalized))
}
