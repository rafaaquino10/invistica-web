'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { cn } from '@/lib/utils'

// ─── aQ Charts Engine v2 ──────────────────────────────────────────
// Gráfico proprietário aQ Invest — Canvas API puro, zero dependências.
// Linha fluida com gradiente vivo, volume integrado, crosshair elegante.

interface ChartDataPoint {
  date: string | Date
  close: number
  open?: number
  high?: number
  low?: number
  volume?: number
}

export type TimeRange = '1D' | '5D' | '1M' | '3M'

interface TVChartProps {
  data: ChartDataPoint[]
  height?: number
  range?: TimeRange
  onRangeChange?: (range: TimeRange) => void
  showVolume?: boolean
  chartType?: 'area' | 'candlestick'
  className?: string
}

const RANGES: TimeRange[] = ['1D', '5D', '1M', '3M']

// ─── Helpers ────────────────────────────────────────────────────

function parseDate(d: string | Date): Date {
  const date = typeof d === 'string' ? new Date(d) : d
  return isNaN(date.getTime()) ? new Date() : date
}

function fmtPrice(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return v.toString()
}

function fmtDateAxis(d: Date, intraday: boolean, spanDays: number): string {
  if (intraday) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const m = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  if (spanDays > 365) return `${m[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
  return `${d.getDate()} ${m[d.getMonth()]}`
}

function fmtDateFull(d: Date, intraday: boolean): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  if (intraday) return `${dd}/${mm}/${yy} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${dd}/${mm}/${yy}`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath()
}

// ─── Colors ─────────────────────────────────────────────────────

const UP_DARK = { line: '#00D4AA', glow: 'rgba(0,212,170,0.35)', grad0: 'rgba(0,212,170,0.28)', grad1: 'rgba(0,212,170,0.02)', vol: 'rgba(0,212,170,0.18)', dot: '#00D4AA' }
const DN_DARK = { line: '#EF4444', glow: 'rgba(239,68,68,0.30)', grad0: 'rgba(239,68,68,0.24)', grad1: 'rgba(239,68,68,0.02)', vol: 'rgba(239,68,68,0.18)', dot: '#EF4444' }
const UP_LIGHT = { line: '#047857', glow: 'rgba(4,120,87,0.30)', grad0: 'rgba(4,120,87,0.18)', grad1: 'rgba(4,120,87,0.01)', vol: 'rgba(4,120,87,0.35)', dot: '#047857' }
const DN_LIGHT = { line: '#B91C1C', glow: 'rgba(185,28,28,0.30)', grad0: 'rgba(185,28,28,0.16)', grad1: 'rgba(185,28,28,0.01)', vol: 'rgba(185,28,28,0.35)', dot: '#B91C1C' }

// ─── Renderer ───────────────────────────────────────────────────

function getPad(cw: number) {
  const compact = cw < 400
  return { top: 16, right: compact ? 56 : 88, bottom: 36, left: compact ? 12 : 20 }
}
const VOL_RATIO = 0.15

function render(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  data: ChartDataPoint[], intraday: boolean, isDark: boolean,
  hover: number | null, dpr: number, showVol: boolean,
) {
  const PAD = getPad(w)
  if (data.length < 2) return
  ctx.clearRect(0, 0, w * dpr, h * dpr)
  ctx.save()
  ctx.scale(dpr, dpr)

  const cW = w - PAD.left - PAD.right
  const firstDate = parseDate(data[0]!.date)
  const lastDate = parseDate(data[data.length - 1]!.date)
  const spanDays = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000)))
  const volH = showVol ? h * VOL_RATIO : 0
  const pH = h - PAD.top - PAD.bottom - volH
  const pBot = PAD.top + pH

  // Ranges
  let lo = Infinity, hi = -Infinity, maxV = 0
  for (const d of data) {
    const l = d.low ?? d.close, h2 = d.high ?? d.close
    if (l < lo) lo = l; if (h2 > hi) hi = h2
    if (showVol && d.volume != null && d.volume > maxV) maxV = d.volume
  }
  const pad = (hi - lo || 1) * 0.08; lo -= pad; hi += pad
  const pR = hi - lo

  const xOf = (i: number) => PAD.left + (i / (data.length - 1)) * cW
  const yOf = (p: number) => PAD.top + (1 - (p - lo) / pR) * pH
  const vY = (v: number) => maxV > 0 ? pBot + volH * (1 - v / maxV) : pBot + volH

  // Direction
  const first = data[0]!.close, last = data[data.length - 1]!.close
  const isUp = last >= first
  const C = isUp ? (isDark ? UP_DARK : UP_LIGHT) : (isDark ? DN_DARK : DN_LIGHT)
  const gridC = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)'
  const txtC = isDark ? '#E5E7EB' : '#000000'

  // ── Grid ──
  ctx.font = 'bold 12px ui-monospace, SFMono-Regular, monospace'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 4; i++) {
    const price = lo + (pR * i) / 4, y = yOf(price)
    ctx.strokeStyle = gridC; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + cW, y); ctx.stroke()
    ctx.fillStyle = txtC; ctx.fillText(`R$${fmtPrice(price)}`, w - 4, y + 4)
  }
  // Vertical grid + time labels
  ctx.textAlign = 'center'
  const maxLabels = Math.min(8, Math.floor(cW / 90))

  if (intraday) {
    for (let i = 0; i <= maxLabels; i++) {
      const idx = Math.floor((i / maxLabels) * (data.length - 1)), x = xOf(idx)
      ctx.strokeStyle = gridC; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, pBot + volH); ctx.stroke()
      ctx.fillStyle = txtC; ctx.fillText(fmtDateAxis(parseDate(data[idx]!.date), true, spanDays), x, h - 4)
    }
  } else {
    // Diário+: coletar datas únicas, depois distribuir no máximo maxLabels
    const uniqueDates: { idx: number; label: string }[] = []
    let lastLabel = ''
    for (let i = 0; i < data.length; i++) {
      const label = fmtDateAxis(parseDate(data[i]!.date), false, spanDays)
      if (label !== lastLabel) {
        uniqueDates.push({ idx: i, label })
        lastLabel = label
      }
    }
    // Se cabem todos, mostrar todos. Senão, espaçar uniformemente.
    const step = uniqueDates.length <= maxLabels ? 1 : Math.ceil(uniqueDates.length / maxLabels)
    for (let i = 0; i < uniqueDates.length; i += step) {
      const { idx, label } = uniqueDates[i]!
      const x = xOf(idx)
      ctx.strokeStyle = gridC; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, pBot + volH); ctx.stroke()
      ctx.fillStyle = txtC; ctx.fillText(label, x, h - 4)
    }
  }

  // ── Volume bars (behind line) ──
  if (showVol && maxV > 0) {
    const bw = Math.max(2, (cW / data.length) * 0.6)
    for (let i = 0; i < data.length; i++) {
      const d = data[i]!; if (!d.volume || d.volume <= 0) continue
      const up = d.close >= (d.open ?? d.close)
      const volDn = isDark ? DN_DARK.vol : DN_LIGHT.vol
      const volUp = isDark ? UP_DARK.vol : UP_LIGHT.vol
      ctx.fillStyle = up ? C.vol : (isUp ? volDn : volUp)
      const t = vY(d.volume), b = pBot + volH
      ctx.fillRect(xOf(i) - bw / 2, t, bw, b - t)
    }
  }

  // ── Build path ──
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < data.length; i++) pts.push({ x: xOf(i), y: yOf(data[i]!.close) })

  // Smooth curve (Catmull-Rom → Bezier)
  function drawSmoothLine() {
    ctx.beginPath()
    ctx.moveTo(pts[0]!.x, pts[0]!.y)
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)]!
      const p1 = pts[i]!
      const p2 = pts[i + 1]!
      const p3 = pts[Math.min(i + 2, pts.length - 1)]!
      const t = 0.35
      const cp1x = p1.x + (p2.x - p0.x) * t / 3
      const cp1y = p1.y + (p2.y - p0.y) * t / 3
      const cp2x = p2.x - (p3.x - p1.x) * t / 3
      const cp2y = p2.y - (p3.y - p1.y) * t / 3
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }
  }

  // ── Glow (blur under line) ──
  const lineW = isDark ? 2.5 : 3
  ctx.save()
  ctx.shadowColor = C.glow
  ctx.shadowBlur = isDark ? 12 : 8
  ctx.strokeStyle = C.line
  ctx.lineWidth = lineW
  drawSmoothLine()
  ctx.stroke()
  ctx.restore()

  // ── Main line ──
  ctx.strokeStyle = C.line
  ctx.lineWidth = lineW
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  drawSmoothLine()
  ctx.stroke()

  // ── Gradient fill ──
  const grad = ctx.createLinearGradient(0, PAD.top, 0, pBot)
  grad.addColorStop(0, C.grad0)
  grad.addColorStop(0.7, C.grad1)
  grad.addColorStop(1, 'transparent')
  drawSmoothLine()
  ctx.lineTo(pts[pts.length - 1]!.x, pBot)
  ctx.lineTo(pts[0]!.x, pBot)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  // ── Current price dashed line ──
  const lastY = yOf(last)
  ctx.strokeStyle = C.line
  ctx.lineWidth = 1
  ctx.setLineDash([3, 4])
  ctx.globalAlpha = 0.5
  ctx.beginPath(); ctx.moveTo(PAD.left, lastY); ctx.lineTo(PAD.left + cW, lastY); ctx.stroke()
  ctx.globalAlpha = 1
  ctx.setLineDash([])

  // Current price badge
  ctx.fillStyle = C.line
  const badge = `R$${fmtPrice(last)}`
  ctx.font = 'bold 12px ui-monospace, SFMono-Regular, monospace'
  const bw = ctx.measureText(badge).width + 14
  roundRect(ctx, PAD.left + cW + 3, lastY - 10, bw, 20, 4)
  ctx.fill()
  ctx.fillStyle = isDark ? '#FFFFFF' : '#FFFFFF'
  ctx.textAlign = 'left'
  ctx.fillText(badge, PAD.left + cW + 10, lastY + 4)

  // ── Crosshair ──
  if (hover != null && hover >= 0 && hover < data.length) {
    const d = data[hover]!
    const hx = pts[hover]!.x, hy = pts[hover]!.y

    // Lines
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)'
    ctx.lineWidth = 1; ctx.setLineDash([3, 3])
    ctx.beginPath(); ctx.moveTo(hx, PAD.top); ctx.lineTo(hx, pBot + volH); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(PAD.left, hy); ctx.lineTo(PAD.left + cW, hy); ctx.stroke()
    ctx.setLineDash([])

    // Glowing dot
    ctx.save()
    ctx.shadowColor = C.glow; ctx.shadowBlur = 10
    ctx.fillStyle = C.dot
    ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
    ctx.fillStyle = isDark ? '#1A1B1E' : '#FFFFFF'
    ctx.beginPath(); ctx.arc(hx, hy, 2.5, 0, Math.PI * 2); ctx.fill()

    // Tooltip
    const date = parseDate(d.date)
    const chg = ((d.close - first) / first) * 100
    const lines: string[] = [
      fmtDateFull(date, intraday),
      `R$${fmtPrice(d.close)}`,
    ]
    if (d.volume != null && d.volume > 0) lines.push(`Vol: ${fmtVol(d.volume)}`)
    lines.push(`${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`)

    ctx.font = 'bold 12px ui-monospace, SFMono-Regular, monospace'
    const mw = Math.max(...lines.map(l => ctx.measureText(l).width))
    const tw = mw + 24, th = lines.length * 20 + 16
    let tx = hx + 14; if (tx + tw > w - 10) tx = hx - tw - 14
    let ty = PAD.top + 8; if (ty + th > pBot) ty = pBot - th - 8

    // Box
    ctx.fillStyle = isDark ? 'rgba(22,23,26,0.95)' : 'rgba(255,255,255,0.97)'
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 1
    roundRect(ctx, tx, ty, tw, th, 8)
    ctx.fill(); ctx.stroke()

    // Text
    ctx.textAlign = 'left'
    for (let i = 0; i < lines.length; i++) {
      const isDate = i === 0
      const isChg = i === lines.length - 1
      const isPrice = i === 1
      if (isDate) { ctx.font = 'bold 12px ui-monospace, SFMono-Regular, monospace'; ctx.fillStyle = isDark ? '#D1D5DB' : '#1F2937' }
      else if (isPrice) { ctx.font = 'bold 15px ui-monospace, SFMono-Regular, monospace'; ctx.fillStyle = isDark ? '#FFFFFF' : '#000000' }
      else if (isChg) { ctx.font = 'bold 13px ui-monospace, SFMono-Regular, monospace'; ctx.fillStyle = chg >= 0 ? C.line : (isDark ? DN_DARK.line : DN_LIGHT.line) }
      else { ctx.font = 'bold 12px ui-monospace, SFMono-Regular, monospace'; ctx.fillStyle = isDark ? '#E5E7EB' : '#000000' }
      ctx.fillText(lines[i]!, tx + 10, ty + 17 + i * 20)
    }
  }

  ctx.restore()
}

// ─── Component ──────────────────────────────────────────────────

export const TVChart = memo(function AQChart({
  data, height = 360, range = '1M', onRangeChange, showVolume = true, className,
}: TVChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [cw, setCw] = useState(0)
  const [isDark, setIsDark] = useState(false)

  // Intraday = mostrar horários no eixo.
  // Detecta pelo espaçamento entre pontos (< 24h = intraday).
  const intraday = (() => {
    if (data.length < 2) return false
    const t0 = parseDate(data[0]!.date).getTime()
    const t1 = parseDate(data[1]!.date).getTime()
    return (t1 - t0) < 86_400_000 // menos de 1 dia entre pontos
  })()

  // Responsive width
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(e => { if (e[0]) setCw(e[0].contentRect.width) })
    obs.observe(containerRef.current)
    setCw(containerRef.current.clientWidth)
    return () => obs.disconnect()
  }, [])

  // Theme detection — observa mudanças na class do <html>
  useEffect(() => {
    const html = document.documentElement
    setIsDark(html.classList.contains('dark'))
    const obs = new MutationObserver(() => setIsDark(html.classList.contains('dark')))
    obs.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // Render
  useEffect(() => {
    const c = canvasRef.current; if (!c || cw === 0 || data.length < 2) return
    const dpr = window.devicePixelRatio || 1
    c.width = cw * dpr; c.height = height * dpr
    c.style.width = `${cw}px`; c.style.height = `${height}px`
    const ctx = c.getContext('2d'); if (!ctx) return
    render(ctx, cw, height, data, intraday, isDark, hover, dpr, showVolume)
  }, [data, cw, height, intraday, hover, showVolume, isDark])

  const getHoverIndex = useCallback((clientX: number) => {
    if (!canvasRef.current || data.length < 2) return null
    const r = canvasRef.current.getBoundingClientRect()
    const pad = getPad(cw)
    const rx = clientX - r.left - pad.left
    const chartW = cw - pad.left - pad.right
    if (rx < 0 || rx > chartW) return null
    return Math.max(0, Math.min(data.length - 1, Math.round((rx / chartW) * (data.length - 1))))
  }, [data.length, cw])

  const onMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setHover(getHoverIndex(e.clientX))
  }, [getHoverIndex])

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0]
    if (touch) setHover(getHoverIndex(touch.clientX))
  }, [getHoverIndex])

  const first = data.length > 0 ? data[0]!.close : 0
  const last = data.length > 0 ? data[data.length - 1]!.close : 0
  const chg = first > 0 ? ((last - first) / first) * 100 : 0
  const isUp = chg >= 0
  const hi = data.reduce((m, d) => Math.max(m, d.high ?? d.close), -Infinity)
  const lo2 = data.reduce((m, d) => Math.min(m, d.low ?? d.close), Infinity)

  return (
    <div className={cn('relative select-none', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-0.5 bg-[var(--surface-2)] rounded-lg p-0.5">
          {RANGES.map(r => (
            <button key={r} onClick={() => onRangeChange?.(r)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[11px] font-mono font-bold transition-all duration-200',
                r === range
                  ? 'bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm'
                  : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
              )}>
              {r}
            </button>
          ))}
        </div>
        {data.length >= 2 && (
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-mono">
            <span className="text-[var(--text-3)]">H <span className="text-[var(--text-2)] font-semibold">R${fmtPrice(hi)}</span></span>
            <span className="text-[var(--text-3)]">L <span className="text-[var(--text-2)] font-semibold">R${fmtPrice(lo2)}</span></span>
            <span className={cn('font-bold text-[13px]', isUp ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
              {isUp ? '+' : ''}{chg.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div ref={containerRef} className="w-full relative">
        {data.length >= 2 ? (
          <canvas ref={canvasRef}
            onMouseMove={onMove} onMouseLeave={() => setHover(null)}
            onTouchMove={onTouchMove} onTouchEnd={() => setHover(null)}
            className="w-full cursor-crosshair rounded-lg touch-none" style={{ height }} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-[var(--surface-2)]/30" style={{ height }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-3)]"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            <p className="text-[var(--text-caption)] text-[var(--text-3)]">Dados insuficientes</p>
          </div>
        )}
      </div>
    </div>
  )
})
