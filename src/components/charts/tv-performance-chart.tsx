'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createChart, type IChartApi, type ISeriesApi, type LineData, type UTCTimestamp, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export interface PerformanceSeries {
  label: string
  data: { date: string; value: number }[]
  color: string
  lineWidth?: number
  lineStyle?: 'solid' | 'dashed'
}

interface Props {
  series: PerformanceSeries[]
  height?: number
  periods?: { label: string; months: number }[]
  activePeriod?: number
  onPeriodChange?: (months: number) => void
  className?: string
}

const DEFAULT_PERIODS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '12M', months: 12 },
]

export function TVPerformanceChart({
  series,
  height = 320,
  periods = DEFAULT_PERIODS,
  activePeriod = 12,
  onPeriodChange,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRefs = useRef<ISeriesApi<'Line'>[]>([])
  const { resolvedTheme } = useTheme()
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; values: { label: string; value: string; color: string }[] } | null>(null)

  const isDark = resolvedTheme === 'dark'

  const getChartColors = useCallback(() => ({
    bg: 'transparent',
    text: isDark ? '#8B919E' : '#5A6170',
    grid: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    crosshair: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
  }), [isDark])

  useEffect(() => {
    if (!containerRef.current) return

    const colors = getChartColors()

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: colors.bg },
        textColor: colors.text,
        fontFamily: "var(--font-geist-mono), 'IBM Plex Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: colors.crosshair, width: 1, style: LineStyle.Dashed, labelVisible: false },
        horzLine: { color: colors.crosshair, width: 1, style: LineStyle.Dashed, labelVisible: true },
      },
      rightPriceScale: {
        borderColor: colors.border,
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: colors.border,
        timeVisible: false,
        rightOffset: 5,
        barSpacing: 6,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: { vertTouchDrag: false },
      watermark: { visible: false },
    })

    chartRef.current = chart

    // Add series
    const lineRefs: ISeriesApi<'Line'>[] = []
    for (const s of series) {
      const lineSeries = chart.addLineSeries({
        color: s.color,
        lineWidth: (s.lineWidth ?? 2) as 1 | 2 | 3 | 4,
        lineStyle: s.lineStyle === 'dashed' ? LineStyle.Dashed : LineStyle.Solid,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        lastValueVisible: true,
        priceLineVisible: false,
      })

      const lineData: LineData[] = s.data.map(d => ({
        time: d.date as unknown as UTCTimestamp,
        value: d.value,
      }))
      lineSeries.setData(lineData)
      lineRefs.push(lineSeries)
    }
    seriesRefs.current = lineRefs

    // Fit content
    chart.timeScale().fitContent()

    // Crosshair tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        setTooltipData(null)
        return
      }

      const values: { label: string; value: string; color: string }[] = []
      for (let i = 0; i < lineRefs.length; i++) {
        const data = param.seriesData.get(lineRefs[i]!)
        if (data && 'value' in data) {
          values.push({
            label: series[i]!.label,
            value: (data.value as number).toFixed(2),
            color: series[i]!.color,
          })
        }
      }

      if (values.length > 0) {
        setTooltipData({ x: param.point.x, y: param.point.y, values })
      }
    })

    // Resize observer
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        chart.applyOptions({ width: entry.contentRect.width })
      }
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRefs.current = []
    }
  }, [series, height, isDark, getChartColors])

  return (
    <div className={cn('relative', className)}>
      {/* Period buttons */}
      {periods.length > 0 && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {periods.map(p => (
            <button
              key={p.months}
              onClick={() => onPeriodChange?.(p.months)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors',
                activePeriod === p.months
                  ? 'bg-[var(--accent-2)] text-[var(--accent-1)]'
                  : 'text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--surface-2)]'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart container */}
      <div ref={containerRef} style={{ height }} />

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="absolute z-20 pointer-events-none rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-md)] px-3 py-2"
          style={{
            left: Math.min(tooltipData.x + 16, (containerRef.current?.clientWidth ?? 400) - 180),
            top: Math.max(tooltipData.y - 60, 4),
          }}
        >
          {tooltipData.values.map(v => (
            <div key={v.label} className="flex items-center gap-2 text-[11px] leading-relaxed">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: v.color }} />
              <span className="text-[var(--text-3)] min-w-[60px]">{v.label}</span>
              <span className="font-mono font-semibold text-[var(--text-1)]">{v.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
