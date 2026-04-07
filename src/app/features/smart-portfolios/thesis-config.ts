export interface ThesisConfig {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  criteria: string[];
  screenerParams: Record<string, string | number>;
  highlightKey: string;
  highlightLabel: string;
  highlightFormat: 'percent' | 'number' | 'score';
}

export const THESIS_CONFIGS: ThesisConfig[] = [
  {
    id: 'valor',
    name: 'Valor Profundo',
    icon: 'scales',
    tagline: 'Ações subavaliadas com fundamentos sólidos',
    description: 'Busca empresas negociando abaixo do seu valor intrínseco, com balanço saudável e geração de caixa consistente. O motor prioriza margem de segurança alta e métricas de valuation atrativas.',
    criteria: ['IQ Score ≥ 70', 'Margem de segurança > 15%'],
    screenerParams: { min_score: 70, min_margin: 0.15 },
    highlightKey: 'safety_margin',
    highlightLabel: 'Margem Seg.',
    highlightFormat: 'percent',
  },
  {
    id: 'renda',
    name: 'Renda Passiva',
    icon: 'currency-dollar',
    tagline: 'Dividendos consistentes e seguros',
    description: 'Seleciona empresas com histórico de distribuição de proventos, dividend yield projetado atrativo e segurança de dividendo elevada. Ideal para geração de renda recorrente.',
    criteria: ['DY Projetado ≥ 6%', 'IQ Score ≥ 50'],
    screenerParams: { min_yield: 0.06, min_score: 50 },
    highlightKey: 'dividend_yield_proj',
    highlightLabel: 'DY Proj.',
    highlightFormat: 'percent',
  },
  {
    id: 'crescimento',
    name: 'Crescimento',
    icon: 'trend-up',
    tagline: 'Empresas expandindo receita e lucro',
    description: 'Foca em empresas com trajetória de crescimento acelerado de receita e rentabilidade. O motor busca ROE elevado, margens em expansão e potencial de rerating.',
    criteria: ['IQ Score ≥ 75'],
    screenerParams: { min_score: 75 },
    highlightKey: 'score_quanti',
    highlightLabel: 'Quanti',
    highlightFormat: 'score',
  },
  {
    id: 'fortaleza',
    name: 'Fortaleza',
    icon: 'shield-check',
    tagline: 'Balanço blindado, baixa volatilidade',
    description: 'Prioriza empresas com baixo endividamento, alta liquidez e solidez operacional. A carteira defensiva para tempos de incerteza — foco em preservação de capital.',
    criteria: ['IQ Score ≥ 60'],
    screenerParams: { min_score: 60 },
    highlightKey: 'dividend_safety',
    highlightLabel: 'Segurança',
    highlightFormat: 'score',
  },
  {
    id: 'momentum',
    name: 'Momentum',
    icon: 'lightning',
    tagline: 'Tendência de alta com fundamento',
    description: 'Identifica ativos com momentum técnico e quantitativo positivo, validados por fundamentos. Não é day trade — é surfar tendências sustentáveis de médio prazo.',
    criteria: ['IQ Score ≥ 65'],
    screenerParams: { min_score: 65 },
    highlightKey: 'iq_score',
    highlightLabel: 'Score IQ',
    highlightFormat: 'score',
  },
];
