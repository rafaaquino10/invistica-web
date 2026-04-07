'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

/**
 * Glossário integrado de termos financeiros.
 * Acessível via link na sidebar ou Ctrl+K "glossário".
 */

interface GlossaryTerm {
  term: string
  abbreviation?: string
  category: 'valuation' | 'qualidade' | 'risco' | 'dividendos' | 'crescimento' | 'macro' | 'geral'
  definition: string
  example?: string
}

const TERMS: GlossaryTerm[] = [
  // Valuation
  { term: 'Preço/Lucro', abbreviation: 'P/L', category: 'valuation', definition: 'Quantos anos de lucro atual o mercado paga pela ação. Menor = mais barato em relação ao lucro.', example: 'P/L de 10x significa que o mercado paga 10 anos de lucro pela empresa.' },
  { term: 'Preço/Valor Patrimonial', abbreviation: 'P/VP', category: 'valuation', definition: 'Relação entre preço de mercado e valor contábil por ação. P/VP < 1 pode indicar desconto.', example: 'P/VP de 0.8 indica que a empresa vale 20% menos que seu patrimônio contábil.' },
  { term: 'Price/Sales Ratio', abbreviation: 'PSR', category: 'valuation', definition: 'Preço da ação dividido pela receita por ação. Útil para empresas sem lucro ainda.' },
  { term: 'EV/EBITDA', category: 'valuation', definition: 'Enterprise Value dividido pelo EBITDA. Compara o valor total da empresa (incluindo dívidas) com sua geração de caixa operacional.' },
  { term: 'Valor Intrínseco', category: 'valuation', definition: 'Estimativa do valor real de uma ação baseada em projeção de fluxo de caixa descontado (DCF). Não é preço justo, é estimativa.' },

  // Qualidade
  { term: 'Retorno sobre Patrimônio', abbreviation: 'ROE', category: 'qualidade', definition: 'Quanto a empresa gera de lucro com o dinheiro dos acionistas. Maior = mais eficiente.', example: 'ROE de 20% significa que a empresa gera R$20 de lucro para cada R$100 de patrimônio.' },
  { term: 'Retorno sobre Capital Investido', abbreviation: 'ROIC', category: 'qualidade', definition: 'Retorno gerado sobre todo o capital investido (próprio + terceiros). Mais rigoroso que ROE.' },
  { term: 'Margem EBIT', category: 'qualidade', definition: 'Percentual da receita que sobra como lucro operacional antes de juros e impostos.' },
  { term: 'Margem Líquida', category: 'qualidade', definition: 'Percentual da receita que sobra como lucro final após todos os custos, juros e impostos.' },

  // Risco
  { term: 'Liquidez Corrente', category: 'risco', definition: 'Capacidade de pagar dívidas de curto prazo. Acima de 1.0 indica que ativos circulantes cobrem passivos circulantes.' },
  { term: 'Dívida/Patrimônio', category: 'risco', definition: 'Proporção de dívida em relação ao patrimônio dos acionistas. Maior = mais alavancada.' },
  { term: 'Dívida Líquida/EBITDA', category: 'risco', definition: 'Quantos anos de geração de caixa operacional seriam necessários para pagar toda a dívida líquida. Menor = mais seguro.', example: 'Dív.Líq/EBITDA de 2.0 significa que levaria ~2 anos para quitar a dívida com o caixa operacional.' },
  { term: 'Beta', category: 'risco', definition: 'Medida de volatilidade da ação em relação ao mercado (IBOV). Beta > 1 = mais volátil que o mercado.' },

  // Dividendos
  { term: 'Dividend Yield', abbreviation: 'DY', category: 'dividendos', definition: 'Percentual do preço da ação pago em dividendos por ano. Maior = mais renda passiva.', example: 'DY de 6% numa ação de R$100 significa R$6/ano em dividendos por ação.' },
  { term: 'Payout', category: 'dividendos', definition: 'Percentual do lucro distribuído como dividendos. Payout muito alto (>90%) pode ser insustentável.' },
  { term: 'Data Com', category: 'dividendos', definition: 'Último dia para comprar a ação e ter direito ao dividendo anunciado.' },
  { term: 'Data Ex', category: 'dividendos', definition: 'Primeiro dia em que a ação é negociada sem direito ao dividendo. O preço geralmente cai pelo valor do dividendo.' },
  { term: 'JCP', category: 'dividendos', definition: 'Juros sobre Capital Próprio — forma alternativa de distribuição. Tem imposto de 15% retido na fonte (dividendos são isentos).' },

  // Crescimento
  { term: 'CAGR', category: 'crescimento', definition: 'Taxa de Crescimento Anual Composta. Crescimento médio anualizado ao longo de um período.' },
  { term: 'Crescimento Receita 5a', category: 'crescimento', definition: 'Variação percentual da receita líquida nos últimos 5 anos. Mostra se a empresa está expandindo.' },

  // Macro
  { term: 'SELIC', category: 'macro', definition: 'Taxa básica de juros da economia brasileira, definida pelo Copom/Banco Central. Referência para todas as taxas de juros.' },
  { term: 'CDI', category: 'macro', definition: 'Certificado de Depósito Interbancário. Taxa de referência para investimentos de renda fixa. Muito próxima da SELIC.' },
  { term: 'IPCA', category: 'macro', definition: 'Índice de Preços ao Consumidor Amplo — inflação oficial do Brasil, medida pelo IBGE.' },
  { term: 'Risk On / Risk Off', category: 'macro', definition: 'Regime de mercado. Risk On = juros baixos, apetite por risco, favorece ações de crescimento. Risk Off = juros altos, aversão a risco, favorece dividendos e defensivos.' },

  // Geral
  { term: 'IQ Score', category: 'geral', definition: 'Nota de 0 a 100 que avalia a saúde financeira de uma ação em 6 dimensões: Valuation, Qualidade, Risco, Dividendos, Crescimento e Qualitativo (moat, earnings quality, Z-Score).' },
  { term: 'Score X-Ray', category: 'geral', definition: 'Visualização detalhada de todas as 18+ sub-notas que compõem o IQ Score, incluindo pesos setoriais e ajustes aplicados.' },
  { term: 'Kill Switch', category: 'geral', definition: 'Mecanismo de segurança que zera o score de empresas com eventos graves (recuperação judicial, fraude contábil, etc.).' },
  { term: 'Fato Relevante', category: 'geral', definition: 'Comunicado obrigatório à CVM sobre eventos que podem impactar significativamente o preço da ação.' },
]

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  valuation: { label: 'Valuation', color: 'var(--accent-1)' },
  qualidade: { label: 'Qualidade', color: 'var(--color-success-500, #00D4AA)' },
  risco: { label: 'Risco', color: 'var(--color-danger-500, #EF4444)' },
  dividendos: { label: 'Dividendos', color: 'var(--color-premium-500, #F59E0B)' },
  crescimento: { label: 'Crescimento', color: 'var(--color-info-500, #3B82F6)' },
  macro: { label: 'Macro', color: '#9333EA' },
  geral: { label: 'Geral', color: 'var(--text-2)' },
}

export function Glossary() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return TERMS.filter(t => {
      const matchesSearch = search.length === 0 ||
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        (t.abbreviation?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        t.definition.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !selectedCategory || t.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [search, selectedCategory])

  const categories = Object.keys(CATEGORY_LABELS)

  return (
    <div className="space-y-4">
      {/* Busca + Filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar termo..."
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-1)]/30 text-[var(--text-small)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-1)]/50"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'text-[var(--text-caption)] px-2 py-1 rounded-md transition-colors',
              !selectedCategory ? 'bg-[var(--accent-1)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-2)]/80'
            )}
          >
            Todos
          </button>
          {categories.map(cat => {
            const config = CATEGORY_LABELS[cat]!
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={cn(
                  'text-[var(--text-caption)] px-2 py-1 rounded-md transition-colors',
                  selectedCategory === cat ? 'text-white' : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-2)]/80'
                )}
                style={selectedCategory === cat ? { backgroundColor: config.color } : undefined}
              >
                {config.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista de termos */}
      <div className="space-y-2">
        {filtered.map(term => {
          const cat = CATEGORY_LABELS[term.category]!
          return (
            <div
              key={term.term}
              className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)]/20 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[var(--text-base)] font-semibold text-[var(--text-1)]">
                  {term.term}
                </h3>
                {term.abbreviation && (
                  <span className="text-[var(--text-caption)] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-2)]">
                    {term.abbreviation}
                  </span>
                )}
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.label}
                </span>
              </div>
              <p className="text-[var(--text-small)] text-[var(--text-2)] leading-relaxed">
                {term.definition}
              </p>
              {term.example && (
                <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-1 italic">
                  {term.example}
                </p>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-[var(--text-small)] text-[var(--text-3)] py-8">
            Nenhum termo encontrado para "{search}"
          </p>
        )}
      </div>
    </div>
  )
}
