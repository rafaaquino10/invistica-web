'use client'

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatMarketCap } from '@/lib/utils/formatters'

// ─── Types ───────────────────────────────────────────────────

export type ColorMode = 'change' | 'score' | 'sector'

interface TreemapStock {
  ticker: string
  name: string
  marketCap: number
  changePercent: number
  aqScore: number | null
  price: number
  logo: string | null
}

interface TreemapSector {
  name: string
  totalMarketCap: number
  averageScore: number | null
  averageChange: number
  stockCount: number
  stocks: TreemapStock[]
}

interface MarketTreemapProps {
  sectors: TreemapSector[]
  colorMode: ColorMode
  minMarketCap?: number
  minScore?: number
  sectorFilter?: string
}

// ─── Color Functions ─────────────────────────────────────────

function getChangeColor(change: number): string {
  if (change > 3) return '#00C853'
  if (change > 1) return '#4CAF50'
  if (change > 0) return '#66BB6A'
  if (change === 0) return '#374151'
  if (change > -1) return '#EF5350'
  if (change > -3) return '#F44336'
  return '#C62828'
}

function getScoreColor(score: number | null): string {
  if (score === null) return '#374151'
  if (score >= 80) return '#00D4AA'
  if (score >= 60) return '#4ADE80'
  if (score >= 40) return '#FB923C'
  return '#EF4444'
}

const SECTOR_COLORS = [
  '#0D9488', '#6366F1', '#EC4899', '#F59E0B', '#8B5CF6',
  '#10B981', '#3B82F6', '#EF4444', '#14B8A6', '#A855F7',
  '#F97316', '#06B6D4', '#84CC16', '#E11D48', '#7C3AED',
  '#22D3EE', '#FB7185', '#34D399', '#FBBF24', '#818CF8',
]

function getSectorColor(sectorIndex: number): string {
  return SECTOR_COLORS[sectorIndex % SECTOR_COLORS.length]!
}

function getCellColor(stock: TreemapStock, colorMode: ColorMode, sectorIndex: number): string {
  switch (colorMode) {
    case 'change': return getChangeColor(stock.changePercent)
    case 'score': return getScoreColor(stock.aqScore)
    case 'sector': return getSectorColor(sectorIndex)
  }
}

function getTextForMode(stock: TreemapStock, colorMode: ColorMode): string {
  switch (colorMode) {
    case 'change': {
      const sign = stock.changePercent >= 0 ? '+' : ''
      return `${sign}${stock.changePercent.toFixed(1)}%`
    }
    case 'score':
      return stock.aqScore !== null ? String(Math.round(stock.aqScore)) : '--'
    case 'sector': {
      const sign = stock.changePercent >= 0 ? '+' : ''
      return `${sign}${stock.changePercent.toFixed(1)}%`
    }
  }
}

// ─── Tooltip ─────────────────────────────────────────────────

interface TooltipData {
  stock: TreemapStock
  sectorName: string
  x: number
  y: number
}

interface SectorTooltipData {
  sector: TreemapSector
  x: number
  y: number
}

function formatMarketCapShort(value: number): string {
  if (value >= 1e12) return `R$ ${(value / 1e12).toFixed(1)}T`
  if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(0)}M`
  return `R$ ${value.toLocaleString('pt-BR')}`
}

function Tooltip({ data }: { data: TooltipData }) {
  const { stock, sectorName, x, y } = data
  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{ left: x + 12, top: y - 10 }}
    >
      <div className="bg-[#1a1a2e] border border-[var(--border-1)]/60 rounded-lg px-3 py-2.5 shadow-[var(--shadow-overlay)] min-w-[200px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-bold text-[var(--text-1)]">{stock.ticker}</span>
          <span className="text-xs text-[var(--text-3)]">{sectorName}</span>
        </div>
        <p className="text-xs text-[var(--text-2)] mb-2 truncate max-w-[220px]">{stock.name}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-[var(--text-3)]">Preço</span>
            <span className="ml-1 font-mono text-[var(--text-1)]">
              R$ {stock.price.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">Variação</span>
            <span className={cn(
              'ml-1 font-mono font-medium',
              stock.changePercent >= 0 ? 'text-teal' : 'text-red'
            )}>
              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">aQ Score</span>
            <span className="ml-1 font-mono font-bold" style={{ color: getScoreColor(stock.aqScore) }}>
              {stock.aqScore !== null ? Math.round(stock.aqScore) : '--'}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">Mkt Cap</span>
            <span className="ml-1 font-mono text-[var(--text-1)]">
              {formatMarketCapShort(stock.marketCap)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectorTooltipComponent({ data }: { data: SectorTooltipData }) {
  const { sector, x, y } = data
  const topStocks = [...sector.stocks]
    .sort((a, b) => (b.aqScore ?? 0) - (a.aqScore ?? 0))
    .slice(0, 3)

  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{ left: x + 12, top: y - 10 }}
    >
      <div className="bg-[#1a1a2e] border border-[var(--border-1)]/60 rounded-lg px-3 py-2.5 shadow-[var(--shadow-overlay)] min-w-[220px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-bold text-[var(--text-1)]">{sector.name}</span>
          <span className="text-xs text-[var(--text-3)]">{sector.stockCount} ações</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
          <div>
            <span className="text-[var(--text-3)]">Mkt Cap</span>
            <span className="ml-1 font-mono text-[var(--text-1)]">
              {formatMarketCapShort(sector.totalMarketCap)}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">Variação</span>
            <span className={cn(
              'ml-1 font-mono font-medium',
              sector.averageChange >= 0 ? 'text-teal' : 'text-red'
            )}>
              {sector.averageChange >= 0 ? '+' : ''}{sector.averageChange.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">aQ Score</span>
            <span className="ml-1 font-mono font-bold" style={{ color: getScoreColor(sector.averageScore) }}>
              {sector.averageScore !== null ? Math.round(sector.averageScore) : '--'}
            </span>
          </div>
        </div>
        {topStocks.length > 0 && (
          <div className="border-t border-[var(--border-1)]/30 pt-1.5 text-xs text-[var(--text-3)]">
            Top: {topStocks.map(s => `${s.ticker} (${s.aqScore !== null ? Math.round(s.aqScore) : '--'})`).join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Treemap Component ───────────────────────────────────────

export function MarketTreemap({
  sectors,
  colorMode,
  minMarketCap = 0,
  minScore,
  sectorFilter,
}: MarketTreemapProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 })
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [sectorTooltip, setSectorTooltip] = useState<SectorTooltipData | null>(null)

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        // Maintain ~16:10 aspect ratio, min height 400
        const height = Math.max(400, Math.min(700, width * 0.6))
        setDimensions({ width, height })
      }
    })
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Filter & prepare data
  const filteredSectors = useMemo(() => {
    let result = sectors
    if (sectorFilter) {
      result = result.filter(s => s.name === sectorFilter)
    }
    return result.map(sector => ({
      ...sector,
      stocks: sector.stocks.filter(stock => {
        if (minMarketCap > 0 && stock.marketCap < minMarketCap) return false
        if (minScore !== undefined && (stock.aqScore === null || stock.aqScore < minScore)) return false
        return true
      }),
    })).filter(s => s.stocks.length > 0)
  }, [sectors, minMarketCap, minScore, sectorFilter])

  // D3 treemap layout
  const treemapData = useMemo(() => {
    const { width, height } = dimensions
    if (width === 0 || height === 0) return null

    // Build hierarchy: root -> sectors -> stocks
    const hierarchyData = {
      name: 'market',
      children: filteredSectors.map((sector, sectorIdx) => ({
        name: sector.name,
        sectorIndex: sectorIdx,
        children: sector.stocks.map(stock => ({
          name: stock.ticker,
          value: stock.marketCap,
          stock,
          sectorName: sector.name,
          sectorIndex: sectorIdx,
        })),
      })),
    }

    const root = d3.hierarchy(hierarchyData)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    const treemap = d3.treemap<typeof hierarchyData>()
      .tile(d3.treemapSquarify.ratio(1.2))
      .size([width, height])
      .paddingOuter(2)
      .paddingTop(18)
      .paddingInner(1)

    treemap(root as any)

    return root
  }, [filteredSectors, dimensions])

  const handleClick = useCallback((ticker: string) => {
    router.push(`/ativo/${ticker}`)
  }, [router])

  const handleMouseMove = useCallback((
    e: React.MouseEvent,
    stock: TreemapStock,
    sectorName: string,
  ) => {
    setTooltip({ stock, sectorName, x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  if (!treemapData) {
    return (
      <div ref={containerRef} className="w-full min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-[var(--text-3)]">Calculando layout...</div>
      </div>
    )
  }

  const leaves = treemapData.leaves() as any[]
  const sectorNodes = (treemapData.children || []) as any[]

  return (
    <div ref={containerRef} className="w-full relative">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="rounded-lg overflow-hidden"
        style={{ background: 'var(--bg)' }}
      >
        {/* Sector group labels — with hover tooltip */}
        {sectorNodes.map((sectorNode: any, idx: number) => {
          const x0 = sectorNode.x0 ?? 0
          const y0 = sectorNode.y0 ?? 0
          const x1 = sectorNode.x1 ?? 0
          const sectorWidth = x1 - x0
          if (sectorWidth < 40) return null

          const sectorData = filteredSectors[idx]

          return (
            <g
              key={`sector-${idx}`}
              onMouseMove={(e) => sectorData && setSectorTooltip({ sector: sectorData, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setSectorTooltip(null)}
              className="cursor-pointer"
            >
              <rect
                x={x0}
                y={y0}
                width={sectorWidth}
                height={18}
                fill="transparent"
              />
              <text
                x={x0 + 4}
                y={y0 + 13}
                className="text-[10px] font-semibold uppercase tracking-wider"
                fill="var(--text-3)"
                style={{ userSelect: 'none' }}
              >
                {sectorWidth > 80 ? sectorNode.data.name : sectorNode.data.name.substring(0, 6)}
              </text>
            </g>
          )
        })}

        {/* Stock cells */}
        {leaves.map((leaf: any) => {
          const x0: number = leaf.x0 ?? 0
          const y0: number = leaf.y0 ?? 0
          const x1: number = leaf.x1 ?? 0
          const y1: number = leaf.y1 ?? 0
          const cellWidth = x1 - x0
          const cellHeight = y1 - y0

          if (cellWidth < 2 || cellHeight < 2) return null

          const stock: TreemapStock = leaf.data.stock
          const sectorName: string = leaf.data.sectorName
          const sectorIndex: number = leaf.data.sectorIndex
          const fillColor = getCellColor(stock, colorMode, sectorIndex)

          const showTicker = cellWidth > 32 && cellHeight > 18
          const showValue = cellWidth > 44 && cellHeight > 32
          const fontSize = cellWidth > 80 && cellHeight > 50 ? 12 : cellWidth > 50 ? 10 : 9

          return (
            <g
              key={stock.ticker}
              onClick={() => handleClick(stock.ticker)}
              onMouseMove={(e) => handleMouseMove(e, stock, sectorName)}
              onMouseLeave={handleMouseLeave}
              className="cursor-pointer"
              style={{ transition: 'opacity 0.15s' }}
            >
              <rect
                x={x0}
                y={y0}
                width={cellWidth}
                height={cellHeight}
                fill={fillColor}
                opacity={0.85}
                rx={1}
                stroke="var(--bg)"
                strokeWidth={0.5}
                className="hover:opacity-100 transition-opacity"
              />
              {showTicker && (
                <text
                  x={x0 + cellWidth / 2}
                  y={y0 + (showValue ? cellHeight / 2 - 2 : cellHeight / 2 + 1)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={fontSize}
                  fontWeight={700}
                  fontFamily="var(--font-geist-mono, monospace)"
                  style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                >
                  {stock.ticker}
                </text>
              )}
              {showValue && (
                <text
                  x={x0 + cellWidth / 2}
                  y={y0 + cellHeight / 2 + fontSize - 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(255,255,255,0.8)"
                  fontSize={Math.max(8, fontSize - 2)}
                  fontWeight={500}
                  fontFamily="var(--font-geist-mono, monospace)"
                  style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                >
                  {getTextForMode(stock, colorMode)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Tooltips */}
      {tooltip && <Tooltip data={tooltip} />}
      {sectorTooltip && !tooltip && <SectorTooltipComponent data={sectorTooltip} />}
    </div>
  )
}
