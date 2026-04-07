'use client'

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'

// ─── Tipos ───────────────────────────────────────────────────

interface SparklineProps {
  /** Pontos pré-calculados (se fornecidos, ignora ticker/changePercent/close) */
  points?: number[]
  /** Ticker para geração determinística de pontos */
  ticker?: string
  /** Variação percentual do dia */
  changePercent?: number
  /** Preço atual de fechamento */
  close?: number
  /** Largura em px */
  width?: number
  /** Altura em px */
  height?: number
  className?: string
  /** aria-label para acessibilidade (leitores de tela) */
  ariaLabel?: string
}

// ─── Funções auxiliares ──────────────────────────────────────

/**
 * Gera um hash numérico determinístico a partir de uma string.
 * Nunca usa Math.random() — baseado no algoritmo djb2.
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Gera pontos de sparkline determinísticos baseados em dados reais do ativo.
 * Nunca usa Math.random() — todos os valores derivam do ticker e cotação.
 * Usa LCG (Linear Congruential Generator) com semente derivada do ticker.
 *
 * @param ticker  - Código do ativo (ex: PETR4)
 * @param changePercent - Variação percentual do dia
 * @param close   - Preço de fechamento atual
 * @returns Array de 29 preços simulados de forma determinística
 */
export function generateRealisticSparkline(
  ticker: string,
  changePercent: number,
  close: number,
): number[] {
  const seed = hashCode(ticker)
  const pontos: number[] = []
  const passos = 28
  // Preço de abertura estimado com base na variação do dia
  const precoInicial = close / (1 + changePercent / 100)
  let rng = seed

  // LCG: gerador congruencial linear determinístico (Lehmer/Park-Miller)
  const proximoRng = () => {
    rng = (rng * 16807 + 0) % 2147483647
    return (rng / 2147483647) - 0.5
  }

  for (let i = 0; i <= passos; i++) {
    const progresso = i / passos
    // Tendência linear do preço inicial ao preço de fechamento
    const tendencia = precoInicial + (close - precoInicial) * progresso
    // Ruído senoidal: amplitude maior no meio da série (mais realista)
    const escalaRuido = Math.sin(progresso * Math.PI) * precoInicial * 0.012
    const preco = tendencia + proximoRng() * escalaRuido + proximoRng() * escalaRuido * 0.5
    pontos.push(preco)
  }

  // Garante que o último ponto seja exatamente o preço de fechamento real
  pontos[pontos.length - 1] = close
  return pontos
}

// ─── Componente ──────────────────────────────────────────────

/**
 * Sparkline — mini gráfico de linha para exibição de variação de preço.
 * Aceita pontos pré-calculados ou gera automaticamente a partir do ticker.
 * Totalmente determinístico: sem Math.random().
 */
export const Sparkline = memo(function Sparkline({
  points: pontosExternos,
  ticker = '',
  changePercent = 0,
  close = 0,
  width = 56,
  height = 22,
  className,
  ariaLabel,
}: SparklineProps) {
  // Usa pontos externos se fornecidos; caso contrário gera a partir do ticker
  const pontos = useMemo(
    () => pontosExternos ?? (ticker ? generateRealisticSparkline(ticker, changePercent, close) : []),
    [pontosExternos, ticker, changePercent, close],
  )

  if (pontos.length < 2) return null

  const margem = 1
  const minVal = Math.min(...pontos)
  const maxVal = Math.max(...pontos)
  const intervalo = maxVal - minVal || 1

  // Calcula coordenadas x e y para cada ponto
  const xs = pontos.map((_, i) => margem + (i / (pontos.length - 1)) * (width - margem * 2))
  const ys = pontos.map((v) => height - margem - ((v - minVal) / intervalo) * (height - margem * 2))

  // Caminho da linha principal
  const caminhoLinha = xs
    .map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${ys[i]!.toFixed(2)}`)
    .join(' ')

  // Caminho da área preenchida (fechado na base do SVG)
  const caminhoArea = `${caminhoLinha} L${xs[xs.length - 1]!.toFixed(2)},${height - margem} L${xs[0]!.toFixed(2)},${height - margem} Z`

  // Cor baseada na direção do movimento de preço
  const ePositivo = (pontos[pontos.length - 1] ?? 0) >= (pontos[0] ?? 0)
  const corLinha = ePositivo ? '#4ADE80' : '#EF4444'
  const corArea = ePositivo ? '#4ADE8020' : '#EF444420'

  // Label para acessibilidade
  const labelAcessibilidade = ariaLabel ?? (ticker
    ? `Gráfico sparkline de ${ticker}: variação de ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
    : 'Gráfico sparkline')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={labelAcessibilidade}
      className={cn('overflow-visible block flex-shrink-0', className)}
    >
      {/* Área preenchida sob a linha */}
      <path d={caminhoArea} fill={corArea} />
      {/* Linha principal do sparkline */}
      <path
        d={caminhoLinha}
        stroke={corLinha}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
})
