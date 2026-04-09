/**
 * Glossário de indicadores financeiros — tooltips explicativos para a UI.
 * Usado em Explorer, detalhe do ativo, X-Ray e comparação.
 */

export const GLOSSARY: Record<string, string> = {
  // IQ-Cognit
  'IQ Score': 'Nota de 0 a 100 que avalia a saúde financeira da ação em 6 dimensões: valuation, qualidade, risco, dividendos, crescimento e qualitativo.',
  'IQ-Cognit': 'Sistema proprietário de análise que combina score quantitativo, diagnóstico IA e monitoramento em tempo real.',

  // Pilares do IQ Score
  'Valuation': 'Mede se o preço está barato ou caro em relação aos fundamentos. Combina DCF, Gordon e múltiplos relativos ao setor (P/L, P/VP, EV/EBITDA).',
  'Qualidade': 'Avalia eficiência operacional, governança e qualidade do lucro. Considera ROE, ROIC, margens, Piotroski F-Score e DuPont.',
  'Risco': 'Analisa solidez financeira e exposição a risco. Inclui Altman Z-Score, Merton PD, endividamento, liquidez e cobertura de juros.',
  'Dividendos': 'Rendimento e sustentabilidade dos proventos. Avalia DY vs SELIC, payout, crescimento 5 anos, safety score e detecção de dividend trap.',
  'Crescimento': 'Trajetória de expansão de receita e lucro nos últimos 5 anos. Inclui CAGR de receita, EBITDA e lucro, ponderado por perspectiva macro.',
  'Qualitativo': 'Avaliação por IA de 6 dimensões: pricing power, alocação de capital, credibilidade da gestão, resiliência, posicionamento competitivo e governança.',

  // Rating
  'STRONG_BUY': 'Compra forte — IQ Score entre 82 e 100. Alta convicção em valorização acima do mercado.',
  'BUY': 'Acumular — IQ Score entre 70 e 81. Fundamentos sólidos com upside relevante.',
  'HOLD': 'Manter — IQ Score entre 45 e 69. Sem catalisadores claros, manter posição.',
  'REDUCE': 'Reduzir — IQ Score entre 30 e 44. Fundamentos deteriorados, considerar redução.',
  'AVOID': 'Evitar — IQ Score abaixo de 30. Riscos significativos, não recomendado.',

  // Valuation avançado
  'Fair Value': 'Valor justo estimado da ação, calculado pela média ponderada de DCF, Gordon e múltiplos do setor.',
  'Margem de Segurança': 'Diferença percentual entre o fair value e o preço atual. Positiva indica desconto, negativa indica prêmio.',
  'Monte Carlo P25': 'Cenário pessimista — 75% de chance do valor justo ser acima deste nível (percentil 25 de 10.000 simulações).',
  'Monte Carlo P75': 'Cenário otimista — 25% de chance do valor justo ser acima deste nível (percentil 75 de 10.000 simulações).',
  'Prob. Upside': 'Probabilidade de a ação superar o CDI nos próximos 12 meses, baseada em simulação Monte Carlo.',
  'DCF': 'Fluxo de Caixa Descontado: projeta 5 anos de geração de caixa + valor terminal, descontados pelo WACC.',
  'Gordon': 'Modelo de Gordon: valoração por dividendos perpétuos. Fair value = D1 / (Ke - g). Ideal para empresas maduras.',

  // Dividendos avançado
  'Dividend Safety': 'Score de 0 a 100 que mede a sustentabilidade dos dividendos. Considera payout, cobertura de FCF, tendência e solvência.',
  'Dividend Trap': 'Armadilha de dividendo: yield alto que mascara deterioração. Detectada quando 2+ sinais: payout >100%, yield >15%, queda >40%, tendência declinante.',
  'YoC': 'Yield on Cost: dividendo anual por ação dividido pelo preço médio de compra. Mede o retorno real sobre o capital investido.',

  // Regime Macro
  'RISK_ON': 'Ambiente favorável: juros em queda, inflação controlada. Favorece crescimento, cíclicas e tech.',
  'RISK_OFF': 'Ambiente adverso: juros altos ou subindo. Favorece dividendos, utilities e defensivas.',
  'STAGFLATION': 'Estagflação: inflação alta com crescimento fraco. Favorece commodities e proteção inflacionária.',
  'RECOVERY': 'Recuperação: saindo de recessão. Favorece cíclicas, industriais e construção.',
  'Kill Switch': 'Gatilho de emergência ativado em condições macroeconômicas extremas. Sinaliza redução de exposição e modo defensivo.',

  // Analytics
  'HHI': 'Índice Herfindahl-Hirschman: mede concentração da carteira. <1500 = baixa, 1500-2500 = moderada, >2500 = alta concentração.',
  'IC Spearman': 'Information Coefficient: correlação entre o IQ Score previsto e os retornos realizados. Mede poder preditivo do modelo.',
  'Hit Rate': 'Percentual de acertos: proporção de ações com IQ alto que efetivamente superaram o benchmark.',
  'Sharpe': 'Retorno ajustado ao risco: (retorno - taxa livre) / volatilidade. Maior = melhor relação risco-retorno.',

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
