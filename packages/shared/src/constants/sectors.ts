// ─── Sector Constants ────────────────────────────────────────
// 18 sector types used in the IQ Score engine.

export const SECTORS = [
  'bancos_financeiro',
  'seguradoras',
  'utilities_energia',
  'saneamento',
  'petroleo_gas',
  'mineracao',
  'siderurgia',
  'papel_celulose',
  'construcao_civil',
  'varejo_consumo',
  'tecnologia',
  'saude',
  'educacao',
  'telecom',
  'industrial',
  'agro',
  'transporte_logistica',
  'outros',
] as const

export type Setor = (typeof SECTORS)[number]

export const SECTOR_LABELS: Record<Setor, string> = {
  bancos_financeiro: 'Bancos / Financeiro',
  seguradoras: 'Seguradoras',
  utilities_energia: 'Energia Elétrica',
  saneamento: 'Saneamento',
  petroleo_gas: 'Petróleo e Gás',
  mineracao: 'Mineração',
  siderurgia: 'Siderurgia',
  papel_celulose: 'Papel e Celulose',
  construcao_civil: 'Construção Civil',
  varejo_consumo: 'Varejo / Consumo',
  tecnologia: 'Tecnologia',
  saude: 'Saúde',
  educacao: 'Educação',
  telecom: 'Telecomunicações',
  industrial: 'Industrial',
  agro: 'Agronegócio',
  transporte_logistica: 'Transporte / Logística',
  outros: 'Outros',
}
