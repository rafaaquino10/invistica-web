// ============================================================
// InvestIQ — Cluster Models (9 clusters, imutável)
// ============================================================

export type ClusterId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const CLUSTER_NAMES: Record<ClusterId, string> = {
  1: 'Financeiro',
  2: 'Commodities',
  3: 'Consumo',
  4: 'Utilities',
  5: 'Saúde',
  6: 'Real Estate',
  7: 'Bens de Capital',
  8: 'Educação',
  9: 'TMT',
};

export interface ClusterWeights {
  quanti: number;
  quali: number;
  valuation: number;
}

export interface ClusterInfo {
  cluster_id: ClusterId;
  name: string;
  weights: ClusterWeights;
  max_dl_ebitda: number | null;
  kpis: string[];
  political_risk_multiplier: number;
}

export interface ClustersResponse {
  clusters: ClusterInfo[];
}
