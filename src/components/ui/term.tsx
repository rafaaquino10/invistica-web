'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const TERMS: Record<string, string> = {
  // Scores
  'IQ-Score': 'Nota geral de 0 a 100 que combina análise de fundamentos, qualidade e valuation de cada ação.',
  'Quantitativo': 'Análise numérica dos fundamentos: receita, lucro, ROE, margens, endividamento e crescimento.',
  'Qualitativo': 'Avaliação de governança, vantagens competitivas, gestão e posicionamento estratégico.',
  'Valuation': 'Quanto a ação vale segundo modelos matemáticos (DCF, Gordon, Múltiplos) vs o preço atual.',
  'Operacional': 'Eficiência operacional: conversão de receita em caixa, qualidade dos lucros.',

  // Ratings
  'Compra Forte': 'IQ-Score alto + desconto significativo em relação ao preço justo.',
  'Acumular': 'Bons fundamentos com preço justo ou leve desconto.',

  // Valuation
  'DCF': 'Fluxo de Caixa Descontado — projeta os lucros futuros e traz a valor presente.',
  'Gordon': 'Modelo de Gordon — calcula o valor justo baseado nos dividendos futuros esperados.',
  'Múltiplos': 'Compara preço/lucro, EV/EBITDA e outros indicadores com empresas do mesmo setor.',
  'Preço Justo': 'Média ponderada dos modelos DCF, Gordon e Múltiplos. Se o preço atual está abaixo, há desconto.',
  'Desconto': 'Diferença percentual entre o preço justo calculado e o preço atual da ação.',
  'Monte Carlo': 'Simulação com milhares de cenários para estimar a faixa provável do preço justo.',

  // Risco
  'Risco de Falência': 'Probabilidade estimada de a empresa não conseguir pagar suas dívidas (modelo de Merton).',
  'Saúde Financeira': 'Nota Piotroski (0-9): avalia lucratividade, alavancagem e eficiência operacional.',
  'Solidez da Empresa': 'Score Altman Z: quanto maior, menor o risco de falência. Abaixo de 1.8 é zona de perigo.',
  'Endividamento': 'Dívida líquida dividida pelo EBITDA. Abaixo de 2x é saudável, acima de 3.5x é preocupante.',
  'DL/EBITDA': 'Dívida Líquida / EBITDA — quantos anos de geração de caixa para pagar a dívida.',
  'Merton PD': 'Probabilidade de default estimada pelo modelo estrutural de Merton.',
  'Piotroski': 'Score de 0 a 9 que mede a saúde financeira com base em 9 critérios contábeis.',
  'Altman Z': 'Modelo que prevê risco de falência. Acima de 3.0 = seguro, abaixo de 1.8 = risco.',
  'ICJ': 'Índice de Cobertura de Juros — quantas vezes o lucro operacional cobre os juros da dívida.',

  // Fundamentos
  'ROE': 'Retorno sobre Patrimônio — quanto a empresa gera de lucro sobre o capital dos acionistas.',
  'ROIC': 'Retorno sobre Capital Investido — eficiência do capital total empregado no negócio.',
  'WACC': 'Custo Médio Ponderado de Capital — taxa mínima de retorno que a empresa precisa gerar.',
  'Margem Líquida': 'Percentual do faturamento que vira lucro líquido após todos os custos e impostos.',
  'Margem Bruta': 'Percentual do faturamento que sobra após custos diretos de produção.',
  'FCF Yield': 'Fluxo de Caixa Livre / Valor de Mercado — quanto de caixa livre a empresa gera por real investido.',

  // DuPont
  'DuPont': 'Decomposição do ROE em 3 partes: margem de lucro, eficiência dos ativos e alavancagem.',
  'Giro': 'Eficiência dos ativos — quanto de receita cada real de ativo gera.',
  'Alavancagem': 'Proporção de capital de terceiros vs capital próprio no financiamento da empresa.',

  // Dividendos
  'Dividend Yield': 'Rendimento em dividendos — total pago nos últimos 12 meses dividido pelo preço da ação.',
  'DY Proj.': 'Dividend Yield projetado para os próximos 12 meses com base no histórico e tendência.',
  'Dividend Safety': 'Nota de 0 a 100 que mede a sustentabilidade do dividendo: payout, caixa, crescimento.',
  'Safety': 'Score de segurança do dividendo. Acima de 70 = dividendo sustentável.',
  'Payout': 'Percentual do lucro líquido distribuído como dividendos. Acima de 90% pode ser insustentável.',
  'Data Com': 'Último dia para comprar a ação e ter direito ao dividendo anunciado.',
  'Data Ex': 'Primeiro dia em que a ação é negociada sem direito ao dividendo.',
  'JCP': 'Juros sobre Capital Próprio — forma de distribuição de lucro com benefício fiscal para a empresa.',
  'Dividend Trap': 'Armadilha de dividendo: yield alto mas insustentável. O preço cai mais do que o dividendo pago.',
  'CAGR': 'Taxa de crescimento anual composta — crescimento médio por ano no período.',

  // Macro
  'SELIC': 'Taxa básica de juros da economia brasileira, definida pelo Banco Central a cada 45 dias.',
  'IPCA': 'Índice oficial de inflação do Brasil, medido pelo IBGE.',
  'CDI': 'Certificado de Depósito Interbancário — benchmark da renda fixa, acompanha a SELIC.',
  'Risk On': 'Cenário favorável para ações: juros caindo, economia crescendo, investidores tomando risco.',
  'Risk Off': 'Cenário desfavorável: juros altos, incerteza, investidores buscando segurança (renda fixa).',
  'Regime': 'Classificação do cenário macro atual pelo IQ-Cognit: Risk On, Risk Off, Recuperação ou Estagflação.',

  // Geral
  'ADTV': 'Volume médio diário negociado — indica a liquidez da ação no mercado.',
  'Fato Relevante': 'Comunicado oficial da empresa à CVM sobre evento que pode impactar o preço da ação.',
  'Kill Switch': 'Mecanismo de segurança que reduz exposição automaticamente em cenários de crise extrema.',
}

interface TermProps {
  children: string
  explain?: string
  className?: string
}

export function Term({ children, explain, className }: TermProps) {
  const [show, setShow] = useState(false)
  const definition = explain ?? TERMS[children]

  if (!definition) return <span className={className}>{children}</span>

  return (
    <span
      className={cn('relative inline-flex items-center gap-0.5 group', className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--text-3)] group-hover:text-[var(--accent-1)] transition-colors flex-shrink-0 cursor-help"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
      {show && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-0 mb-2 w-64 px-3 py-2 text-[12px] leading-relaxed font-normal rounded-lg bg-[var(--text-1)] text-[var(--bg)] shadow-lg animate-fade-in pointer-events-none"
        >
          {definition}
          <span className="absolute top-full left-4 w-0 h-0 border-4 border-transparent border-t-[var(--text-1)]" />
        </span>
      )}
    </span>
  )
}
