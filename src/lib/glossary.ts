/**
 * Glossário de indicadores financeiros — tooltips explicativos para a UI.
 * Usado em Explorer, detalhe do ativo, X-Ray e comparação.
 */

export const GLOSSARY: Record<string, string> = {
  // aQ Intelligence
  'aQ Score': 'Nota de 0 a 100 que avalia a saúde financeira da ação em 6 dimensões: valuation, qualidade, risco, dividendos, crescimento e qualitativo.',
  'aQ Intelligence': 'Sistema proprietário de análise que combina score quantitativo, diagnóstico IA e monitoramento em tempo real.',

  // Valuation
  'P/L': 'Preço/Lucro: quantos anos de lucro atual o mercado paga pela ação. Menor = mais barato.',
  'P/VP': 'Preço/Valor Patrimonial: compara o preço de mercado com o valor contábil. Abaixo de 1 pode indicar desconto.',
  'PSR': 'Price/Sales Ratio: preço dividido pela receita por ação. Útil para empresas sem lucro.',
  'P/EBIT': 'Preço/EBIT: avalia quanto o mercado paga pelo lucro operacional.',
  'EV/EBIT': 'Enterprise Value/EBIT: valor da empresa inteira dividido pelo lucro operacional. Considera dívida.',
  'EV/EBITDA': 'Enterprise Value/EBITDA: métrica de valuation que desconsidera depreciação e amortização.',
  'Valor Intrínseco': 'Estimativa do valor justo da ação baseada em projeção de fluxo de caixa descontado (DCF). Não constitui recomendação.',

  // Qualidade
  'ROE': 'Retorno sobre Patrimônio: quanto a empresa gera de lucro com o dinheiro dos acionistas. Maior = mais eficiente.',
  'ROIC': 'Retorno sobre Capital Investido: eficiência na geração de lucro com todo capital empregado (próprio + terceiros).',
  'Margem EBIT': 'Percentual da receita que sobra como lucro operacional, antes de juros e impostos.',
  'Margem Líquida': 'Percentual da receita que sobra como lucro líquido final, após todos os custos.',

  // Risco
  'Liq. Corrente': 'Ativo circulante / Passivo circulante. Acima de 1 indica capacidade de pagar dívidas de curto prazo.',
  'Dív/Patrimônio': 'Dívida bruta dividida pelo patrimônio líquido. Maior = mais alavancada.',
  'Beta': 'Sensibilidade da ação em relação ao IBOV. Beta > 1 = mais volátil que o mercado, Beta < 1 = mais defensiva.',
  'P/Cap. Giro': 'Preço da ação dividido pelo capital de giro por ação.',
  'P/Ativ. Circ. Líq.': 'Preço dividido pelo ativo circulante líquido por ação. Indica quanto se paga pelos ativos de curto prazo.',
  'P/Ativo': 'Preço dividido pelo ativo total por ação. Múltiplo de valuation conservador.',
  'Patrimônio Líquido': 'Total de ativos menos total de passivos. Representa o valor contábil pertencente aos acionistas.',

  // Dividendos
  'DY': 'Dividend Yield: percentual do preço da ação pago em dividendos por ano. Maior = mais renda passiva.',
  'Dividend Yield': 'Percentual do preço da ação distribuído em dividendos nos últimos 12 meses.',
  'Payout': 'Percentual do lucro líquido distribuído como dividendos. Alto payout pode limitar reinvestimento.',
  'Dív/EBITDA': 'Dívida líquida dividida pelo EBITDA. Mede quantos anos de geração de caixa são necessários para quitar a dívida.',
  'Dív. Líq./EBITDA': 'Dívida líquida dividida pelo EBITDA. Quantos anos de EBITDA seriam necessários para quitar a dívida.',
  'Cobertura FCF': 'Fluxo de Caixa Livre / Dividendos pagos. Acima de 1.5 = dividendo sustentável. Abaixo de 1.0 = risco de corte.',

  // Crescimento
  'Cresc. Receita 5a': 'Taxa composta de crescimento anual da receita nos últimos 5 anos.',
  'Cresc. Lucro 5a': 'Taxa composta de crescimento anual do lucro nos últimos 5 anos.',
  'PEG Ratio': 'P/L dividido pelo crescimento. PEG < 1 pode indicar ação barata pelo crescimento que entrega.',

  // Outros
  'Mkt Cap': 'Capitalização de mercado: valor total da empresa na bolsa (preço × número de ações).',
  'Liquidez': 'Volume médio de negociação dos últimos 2 meses. Maior liquidez = mais fácil comprar/vender.',
  'Liquidez 2 meses': 'Volume financeiro médio diário dos últimos 2 meses de negociação.',
  'Momento': 'Tendência de preço recente. BULL = alta, BEAR = queda, NEUTRO = lateral.',
}

/**
 * Retorna o tooltip de um indicador financeiro.
 * Retorna undefined se o indicador não for encontrado.
 */
export function getTooltip(indicator: string): string | undefined {
  return GLOSSARY[indicator]
}
