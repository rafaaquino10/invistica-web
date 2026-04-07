'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, type IChartApi, type ISeriesApi, type LineData, type UTCTimestamp, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export interface IntradaySeries {
  label: string
  data: { time: string; value: number }[]
  color: string
  lineWidth?: number
}

interface Props {
  series: IntradaySeries[]
  height?: number
  className?: string
}

export function TVIntradayChart({ series, height = 200, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const { resolvedTheme } = useTheme()
  const [tooltip, setTooltip] = useState<{ x: number; y: number; values: { label: string; value: string; color: string }[] } | null>(null)

  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    if (!containerRef.current || series.length === 0) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#8B919E' : '#5A6170',
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)', width: 1, style: LineStyle.Dashed, labelVisible: false },
        horzLine: { color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.08 } },
      timeScale: { borderVisible: false, timeVisible: true, rightOffset: 3, fixLeftEdge: true, fixRightEdge: true },
      handleScroll: { vertTouchDrag: false },
      watermark: { visible: false },
    })
    chartRef.current = chart

    const lineRefs: ISeriesApi<'Line'>[] = []
    for (const s of series) {
      const line = chart.addLineSeries({
        color: s.color,
        lineWidth: (s.lineWidth ?? 2) as 1 | 2 | 3 | 4,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        lastValueVisible: false,
        priceLineVisible: false,
      })
      line.setData(s.data.map(d => ({ time: d.time as unknown as UTCTimestamp, value: d.value })))
      lineRefs.push(line)
    }

    chart.timeScale().fitContent()

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0) { setTooltip(null); return }
      const values: { label: string; value: string; color: string }[] = []
      for (let i = 0; i < lineRefs.length; i++) {
        const data = param.seriesData.get(lineRefs[i]!)
        if (data && 'value' in data) {
          values.push({ label: series[i]!.label, value: (data.value as number).toFixed(2), color: series[i]!.color })
        }
      }
      if (values.length) setTooltip({ x: param.point.x, y: param.point.y, values })
    })

    const obs = new ResizeObserver(([e]) => { if (e) chart.applyOptions({ width: e.contentRect.width }) })
    obs.observe(containerRef.current)

    return () => { obs.disconnect(); chart.remove() }
  }, [series, height, isDark])

  return (
    <div className={cn('relative', className)}>
      <div ref={containerRef} style={{ height }} />
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-md)] px-2.5 py-1.5"
          style={{ left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth ?? 300) - 160), top: Math.max(tooltip.y - 50, 4) }}
        >
          {tooltip.values.map(v => (
            <div key={v.label} className="flex items-center gap-2 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: v.color }} />
              <span className="text-[var(--text-3)]">{v.label}</span>
              <span className="font-mono font-semibold text-[var(--text-1)]">{v.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
