// ============================================================
// InvestIQ — Regime Models (4 macro regimes)
// ============================================================

export type RegimeType = 'RISK_ON' | 'RISK_OFF' | 'STAGFLATION' | 'RECOVERY';

export const REGIME_LABELS: Record<RegimeType, string> = {
  RISK_ON: 'Expansão',
  RISK_OFF: 'Contração',
  STAGFLATION: 'Estagflação',
  RECOVERY: 'Recuperação',
};

export const REGIME_COLORS: Record<RegimeType, string> = {
  RISK_ON: 'var(--positive)',
  RISK_OFF: 'var(--negative)',
  STAGFLATION: 'var(--warning)',
  RECOVERY: 'var(--info)',
};

export interface MacroIndicators {
  selic: number;
  ipca: number;
  cambio_usd: number;
  brent: number;
}

export interface SectorTilt {
  cluster_id: number;
  tilt_points: number;
  signal: string;
}

export interface RegimeResult {
  regime: RegimeType;
  label: string;
  description: string;
  color: string;
  kill_switch_active: boolean;
  macro: MacroIndicators;
  weight_adjustments: Record<string, number>;
  sector_rotation: Record<string, SectorTilt>;
}

export interface SectorRotationMatrix {
  matrix: Record<RegimeType, Record<string, number>>;
  clusters: Record<string, string>;
}
