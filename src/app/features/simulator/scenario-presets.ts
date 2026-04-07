export interface ScenarioPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  params: Record<string, any>;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'valor', name: 'Valor Profundo', icon: 'scales',
    description: 'Top picks por margem de segurança, 10 anos',
    risk: 'medium',
    params: { start_date: '2015-01-01', end_date: '2025-01-01', long_pct: 0.15, enable_short: false },
  },
  {
    id: 'dividendos', name: 'Dividendos Máximo', icon: 'currency-dollar',
    description: 'Maiores DY com safety alto, 10 anos',
    risk: 'low',
    params: { start_date: '2015-01-01', end_date: '2025-01-01', long_pct: 0.20, enable_short: false },
  },
  {
    id: 'cognit', name: 'IQ-Cognit Full', icon: 'brain',
    description: 'O motor completo com long & short',
    risk: 'high',
    params: { start_date: '2012-01-01', end_date: '2025-01-01', enable_short: true, enable_leverage: true },
  },
  {
    id: 'conservador', name: 'Conservador', icon: 'shield-check',
    description: 'Poucos ativos, sem short, sem alavancagem',
    risk: 'low',
    params: { start_date: '2015-01-01', end_date: '2025-01-01', long_pct: 0.10, enable_short: false, enable_leverage: false },
  },
  {
    id: 'custom', name: 'Personalizado', icon: 'sliders-horizontal',
    description: 'Configure você mesmo',
    risk: 'medium',
    params: {},
  },
];
