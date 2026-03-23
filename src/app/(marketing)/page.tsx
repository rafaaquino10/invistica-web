'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Button } from '@/components/ui'
import { AQSymbol } from '@/components/brand'
import { getScoreTextClass, getScoreBgClass } from '@/lib/utils/formatters'

// ─── Stock Pool (20 stocks with full pillar data) ───────────

interface StockData {
  ticker: string
  price: string
  score: number
  pillars: { val: number; qual: number; risc: number; div: number; cresc: number; quali: number }
}

const STOCK_POOL: StockData[] = [
  { ticker: 'WEGE3', price: 'R$ 52,30', score: 85, pillars: { val: 35, qual: 95, risc: 92, div: 45, cresc: 92, quali: 88 } },
  { ticker: 'ITUB4', price: 'R$ 33,12', score: 78, pillars: { val: 72, qual: 80, risc: 85, div: 68, cresc: 55, quali: 75 } },
  { ticker: 'VALE3', price: 'R$ 68,45', score: 68, pillars: { val: 78, qual: 62, risc: 58, div: 72, cresc: 48, quali: 60 } },
  { ticker: 'PETR4', price: 'R$ 38,90', score: 72, pillars: { val: 82, qual: 65, risc: 55, div: 80, cresc: 52, quali: 55 } },
  { ticker: 'TAEE11', price: 'R$ 11,45', score: 82, pillars: { val: 68, qual: 78, risc: 90, div: 92, cresc: 45, quali: 82 } },
  { ticker: 'BBAS3', price: 'R$ 28,60', score: 74, pillars: { val: 85, qual: 72, risc: 70, div: 75, cresc: 50, quali: 68 } },
  { ticker: 'TOTS3', price: 'R$ 30,45', score: 81, pillars: { val: 42, qual: 90, risc: 88, div: 38, cresc: 95, quali: 80 } },
  { ticker: 'BBSE3', price: 'R$ 35,90', score: 80, pillars: { val: 75, qual: 82, risc: 85, div: 88, cresc: 48, quali: 78 } },
  { ticker: 'SUZB3', price: 'R$ 55,20', score: 69, pillars: { val: 60, qual: 72, risc: 65, div: 55, cresc: 78, quali: 62 } },
  { ticker: 'RENT3', price: 'R$ 42,80', score: 76, pillars: { val: 48, qual: 85, risc: 80, div: 42, cresc: 88, quali: 72 } },
  { ticker: 'EQTL3', price: 'R$ 31,50', score: 77, pillars: { val: 62, qual: 78, risc: 82, div: 75, cresc: 68, quali: 75 } },
  { ticker: 'PRIO3', price: 'R$ 46,10', score: 73, pillars: { val: 70, qual: 68, risc: 60, div: 35, cresc: 90, quali: 58 } },
  { ticker: 'ABEV3', price: 'R$ 14,85', score: 71, pillars: { val: 65, qual: 75, risc: 78, div: 82, cresc: 38, quali: 70 } },
  { ticker: 'ELET3', price: 'R$ 44,20', score: 75, pillars: { val: 72, qual: 70, risc: 68, div: 78, cresc: 65, quali: 65 } },
  { ticker: 'B3SA3', price: 'R$ 12,30', score: 70, pillars: { val: 58, qual: 76, risc: 75, div: 70, cresc: 62, quali: 72 } },
  { ticker: 'VIVT3', price: 'R$ 52,80', score: 79, pillars: { val: 70, qual: 82, risc: 85, div: 85, cresc: 42, quali: 78 } },
  { ticker: 'RADL3', price: 'R$ 28,40', score: 83, pillars: { val: 38, qual: 92, risc: 90, div: 52, cresc: 90, quali: 85 } },
  { ticker: 'FLRY3', price: 'R$ 16,90', score: 74, pillars: { val: 68, qual: 78, risc: 76, div: 72, cresc: 65, quali: 70 } },
  { ticker: 'CSAN3', price: 'R$ 18,50', score: 67, pillars: { val: 72, qual: 62, risc: 58, div: 60, cresc: 70, quali: 55 } },
  { ticker: 'MGLU3', price: 'R$ 8,45', score: 42, pillars: { val: 55, qual: 28, risc: 25, div: 10, cresc: 65, quali: 20 } },
]

// ─── Types for Animation ────────────────────────────────────

interface ConveyorItem {
  id: string
  stock: StockData
  phase: 'entering' | 'processing' | 'done'
  lane?: number
}

// ─── Conveyor Belt Dots (background movement) ───────────────

function ConveyorDots() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--accent-1)]/20"
          initial={{ x: -10 }}
          animate={{ x: '100vw' }}
          transition={{
            duration: 8,
            delay: i * 1.3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ top: '50%' }}
        />
      ))}
    </div>
  )
}

// ─── Processed Stock Card ───────────────────────────────────

function ProcessedCard({ stock }: { stock: StockData }) {
  const pillarEntries = [
    { label: 'Val', value: stock.pillars.val },
    { label: 'Qual', value: stock.pillars.qual },
    { label: 'Risc', value: stock.pillars.risc },
    { label: 'Div', value: stock.pillars.div },
    { label: 'Cresc', value: stock.pillars.cresc },
    { label: 'QLT', value: stock.pillars.quali },
  ]

  return (
    <div className="w-[152px] flex-shrink-0 bg-[var(--surface-1)] border border-[var(--border-1)]/30 rounded-lg p-3">
      {/* Header: Ticker + Price */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Image
            src={`https://icons.brapi.dev/icons/${stock.ticker}.svg`}
            alt={stock.ticker} width={16} height={16}
            className="rounded-sm" unoptimized
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span className="text-xs font-semibold text-[var(--text-1)]">{stock.ticker}</span>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-3)]">{stock.price}</span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex-1 h-1 rounded-full bg-[var(--surface-2)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stock.score}%` }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className={`h-full rounded-full ${getScoreBgClass(stock.score)}`}
          />
        </div>
        <span className={`text-sm font-bold font-mono ${getScoreTextClass(stock.score)}`}>
          {stock.score}
        </span>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-5 gap-0.5 text-center">
        {pillarEntries.map((p) => (
          <div key={p.label}>
            <div className="text-[8px] text-[var(--text-3)] leading-none mb-0.5">{p.label}</div>
            <div className={`text-[10px] font-mono font-semibold ${getScoreTextClass(p.value)}`}>{p.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Conveyor Animation Hook (shared desktop/mobile) ─────────

interface ConveyorOptions {
  batchSize: [number, number]
  maxVisible: number
  maxConveyor: number
  lanes: number[]
}

function useConveyorAnimation(opts: ConveyorOptions) {
  const [conveyorItems, setConveyorItems] = useState<ConveyorItem[]>([])
  const [processedCards, setProcessedCards] = useState<StockData[]>([])
  const lastUsedRef = useRef<string[]>([])
  const counterRef = useRef(0)
  const isActiveRef = useRef(true)

  const pickRandomStock = useCallback((): StockData => {
    const recent = new Set(lastUsedRef.current.slice(-8))
    const available = STOCK_POOL.filter((s) => !recent.has(s.ticker))
    const pool = available.length > 0 ? available : STOCK_POOL
    const picked = pool[Math.floor(Math.random() * pool.length)] as StockData
    lastUsedRef.current.push(picked.ticker)
    if (lastUsedRef.current.length > 12) lastUsedRef.current.shift()
    return picked
  }, [])

  useEffect(() => {
    isActiveRef.current = true

    const startTimeout = setTimeout(() => {
      if (!isActiveRef.current) return
      spawnBatch()
    }, 600)

    const interval = setInterval(() => {
      if (!isActiveRef.current) return
      spawnBatch()
    }, 3200)

    function spawnBatch() {
      const [min, max] = opts.batchSize
      const batchSize = min + Math.floor(Math.random() * (max - min + 1))
      for (let b = 0; b < batchSize; b++) {
        const staggerDelay = b * 280
        setTimeout(() => {
          if (!isActiveRef.current) return
          spawnStock(b)
        }, staggerDelay)
      }
    }

    function spawnStock(laneIndex: number) {
      const stock = pickRandomStock()
      const id = `item-${counterRef.current++}`
      const lane = opts.lanes[laneIndex % opts.lanes.length] ?? 0

      setConveyorItems((prev) => [
        ...prev.slice(-opts.maxConveyor),
        { id, stock, phase: 'entering' as const, lane },
      ])

      setTimeout(() => {
        if (!isActiveRef.current) return
        setConveyorItems((prev) =>
          prev.map((item) => item.id === id ? { ...item, phase: 'processing' as const } : item)
        )
      }, 1000)

      setTimeout(() => {
        if (!isActiveRef.current) return
        setConveyorItems((prev) => prev.filter((item) => item.id !== id))
        setProcessedCards((prev) => {
          const next = [...prev, stock]
          return next.slice(-opts.maxVisible)
        })
      }, 1800)
    }

    return () => {
      isActiveRef.current = false
      clearTimeout(startTimeout)
      clearInterval(interval)
    }
  }, [pickRandomStock, opts.batchSize, opts.maxConveyor, opts.maxVisible, opts.lanes])

  const isProcessing = conveyorItems.some((item) => item.phase === 'processing')
  return { conveyorItems, processedCards, isProcessing }
}

// ─── Score Pipeline — Continuous Conveyor Animation (Desktop) ─

const DESKTOP_LANES = [-32, 0, 28, -16, 16]
const DESKTOP_OPTS: ConveyorOptions = { batchSize: [2, 3], maxVisible: 4, maxConveyor: 6, lanes: DESKTOP_LANES }

function ScorePipeline() {
  const { conveyorItems, processedCards, isProcessing } = useConveyorAnimation(DESKTOP_OPTS)

  return (
    <div className="relative w-full mt-16 hidden lg:block">
      {/* Conveyor track lines — multiple lanes */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
        <div className="h-px border-t border-dashed border-[var(--border-1)]/20 -translate-y-3" />
        <div className="h-px border-t border-dashed border-[var(--border-1)]/30" />
        <div className="h-px border-t border-dashed border-[var(--border-1)]/20 translate-y-3" />
      </div>

      {/* Conveyor dots */}
      <ConveyorDots />

      <div className="relative h-[200px]">
        {/* Center — aQ Score Engine (absolutely centered on page) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          {/* Soft glow behind — intensifies subtly on processing */}
          <motion.div
            animate={{
              opacity: isProcessing ? 0.35 : 0.12,
              scale: isProcessing ? 1.08 : 1,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute w-[140px] h-[140px] rounded-full bg-[var(--accent-1)]/10 blur-2xl"
          />

          {/* Processing flash */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1.1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute w-[120px] h-[120px] rounded-full bg-[var(--accent-1)]/10 blur-xl"
              />
            )}
          </AnimatePresence>

          {/* Engine symbol — subtle breathing, NO boxShadow border */}
          <motion.div
            animate={{
              scale: isProcessing ? [1, 1.04, 1] : [1, 1.02, 1],
            }}
            transition={{
              duration: isProcessing ? 1.5 : 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <AQSymbol size={96} />
          </motion.div>

          <span className="mt-3 text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--accent-1)]/70">
            aQ Intelligence™
          </span>
        </div>

        {/* Left zone — entering stocks (ends before engine center) */}
        <div className="absolute left-0 top-0 bottom-0 right-1/2 mr-[70px] flex items-center justify-end">
          <div className="relative w-[280px] h-full">
            <AnimatePresence>
              {conveyorItems
                .filter((item) => item.phase === 'entering')
                .map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ x: -240, opacity: 0, scale: 0.7 }}
                    animate={{ x: 200, opacity: 0.7, scale: 1 }}
                    exit={{ x: 300, opacity: 0, scale: 0.5 }}
                    transition={{
                      duration: 0.9,
                      ease: [0.15, 0, 0.3, 1],
                    }}
                    className="absolute flex items-center gap-2"
                    style={{ top: `calc(50% + ${item.lane ?? 0}px)`, translateY: '-50%' }}
                  >
                    <Image
                      src={`https://icons.brapi.dev/icons/${item.stock.ticker}.svg`}
                      alt={item.stock.ticker} width={18} height={18}
                      className="rounded-sm opacity-40" unoptimized
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <span className="text-sm font-mono text-[var(--text-3)]/50 whitespace-nowrap">
                      {item.stock.ticker}
                    </span>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right zone — processed cards (starts after engine center) */}
        <div className="absolute right-0 top-0 bottom-0 left-1/2 ml-[70px] flex items-center">
          <div className="flex items-center gap-2.5 overflow-hidden pl-4">
            <AnimatePresence mode="popLayout">
              {processedCards.map((stock, i) => (
                <motion.div
                  key={`${stock.ticker}-${i}`}
                  initial={{ x: -60, opacity: 0, scale: 0.85 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  exit={{ x: 40, opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.5,
                    ease: 'easeOut',
                  }}
                  layout
                >
                  <ProcessedCard stock={stock} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mobile Conveyor Dots (vertical) ─────────────────────────

function MobileConveyorDots() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[var(--accent-1)]/20"
          initial={{ y: -10 }}
          animate={{ y: 280 }}
          transition={{
            duration: 4,
            delay: i * 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ left: '50%', marginLeft: (i % 2 === 0 ? -2 : 2) }}
        />
      ))}
    </div>
  )
}

// ─── Score Pipeline — Mobile (vertical flow) ─────────────────

const MOBILE_LANES = [-12, 0, 12]
const MOBILE_OPTS: ConveyorOptions = { batchSize: [1, 2], maxVisible: 1, maxConveyor: 3, lanes: MOBILE_LANES }

function MobileScorePipeline() {
  const { conveyorItems, processedCards, isProcessing } = useConveyorAnimation(MOBILE_OPTS)

  return (
    <div className="relative w-full mt-10 block lg:hidden">
      {/* Vertical track lines */}
      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex gap-1.5">
        <div className="w-px border-l border-dashed border-[var(--border-1)]/20" />
        <div className="w-px border-l border-dashed border-[var(--border-1)]/30" />
        <div className="w-px border-l border-dashed border-[var(--border-1)]/20" />
      </div>

      <MobileConveyorDots />

      <div className="relative flex flex-col items-center" style={{ minHeight: 280 }}>
        {/* Top zone — entering tickers (falling down) */}
        <div className="relative h-[60px] w-full">
          <AnimatePresence>
            {conveyorItems
              .filter((item) => item.phase === 'entering')
              .map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ y: -40, opacity: 0, scale: 0.7 }}
                  animate={{ y: 40, opacity: 0.7, scale: 1 }}
                  exit={{ y: 70, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="absolute flex items-center gap-1.5"
                  style={{ left: `calc(50% + ${item.lane ?? 0}px)`, translateX: '-50%' }}
                >
                  <Image
                    src={`https://icons.brapi.dev/icons/${item.stock.ticker}.svg`}
                    alt={item.stock.ticker} width={16} height={16}
                    className="rounded-sm opacity-40" unoptimized
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="text-xs font-mono text-[var(--text-3)]/50 whitespace-nowrap">
                    {item.stock.ticker}
                  </span>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* Center — aQ Score Engine */}
        <div className="relative z-10 flex flex-col items-center py-3">
          <motion.div
            animate={{
              opacity: isProcessing ? 0.35 : 0.12,
              scale: isProcessing ? 1.06 : 1,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute w-[80px] h-[80px] rounded-full bg-[var(--accent-1)]/10 blur-xl"
          />
          <motion.div
            animate={{
              scale: isProcessing ? [1, 1.04, 1] : [1, 1.02, 1],
            }}
            transition={{
              duration: isProcessing ? 1.5 : 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <AQSymbol size={56} />
          </motion.div>
          <span className="mt-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--accent-1)]/70">
            aQ Intelligence™
          </span>
        </div>

        {/* Bottom zone — processed card (1 at a time) */}
        <div className="flex justify-center pt-3">
          <AnimatePresence mode="wait">
            {processedCards.slice(-1).map((stock, i) => (
              <motion.div
                key={`${stock.ticker}-${i}`}
                initial={{ y: -20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <ProcessedCard stock={stock} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── Score Pillar Bar ───────────────────────────────────────

function PillarBar({ name, value, delay = 0 }: { name: string; value: number; delay?: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-[var(--text-2)]">{name}</span>
        <span className={`font-mono font-semibold ${getScoreTextClass(value)}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay, ease: 'easeOut' }}
          className={`h-full rounded-full ${getScoreBgClass(value)}`}
        />
      </div>
    </div>
  )
}


// ─── Section Background Patterns ────────────────────────────

function DotPattern() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  )
}

function DiagonalLines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.02]"
      style={{
        backgroundImage: 'repeating-linear-gradient(135deg, currentColor 0, currentColor 1px, transparent 1px, transparent 16px)',
      }}
    />
  )
}

function HorizontalGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, currentColor 39px, currentColor 40px)',
      }}
    />
  )
}

// ─── Wealth Growth Background ────────────────────────────────

// Hand-crafted growth curve — smooth S-curve, no math artifacts
// Starts flat-ish, steady ascent, graceful acceleration at the end
const WEALTH_PATH = 'M 0 82 C 12 81, 20 78, 30 74 C 40 70, 48 64, 56 56 C 64 48, 72 38, 80 28 C 88 20, 94 16, 100 14'
const WEALTH_AREA_PATH = WEALTH_PATH + ' L 100 100 L 0 100 Z'

function RisingChart() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="wealthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A73E8" stopOpacity={0.09} />
            <stop offset="50%" stopColor="#1A73E8" stopOpacity={0.04} />
            <stop offset="100%" stopColor="#1A73E8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="wealthStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1A73E8" stopOpacity={0.15} />
            <stop offset="50%" stopColor="#1A73E8" stopOpacity={0.30} />
            <stop offset="100%" stopColor="#0D9488" stopOpacity={0.25} />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <motion.path
          d={WEALTH_AREA_PATH}
          fill="url(#wealthFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.4 }}
        />
        {/* Growth curve — continuous, no gaps, no pathLength (causes dash artifacts) */}
        <motion.path
          d={WEALTH_PATH}
          fill="none"
          stroke="url(#wealthStroke)"
          strokeWidth={0.12}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
      </svg>
    </div>
  )
}

// ─── Hero Atmosphere ─────────────────────────────────────────

/** Grain texture + ambient light + rising chart — material depth with data visualization */
function HeroAtmosphere() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Rising chart — draws in gradually behind all content */}
      <RisingChart />
      {/* Film grain — micro-noise like premium paper stock */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.14]" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      {/* Ambient glow — off-center light that gives depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 55% 45% at 30% 25%, rgba(26, 115, 232, 0.07), transparent 70%),
            radial-gradient(ellipse 45% 40% at 75% 70%, rgba(13, 148, 136, 0.05), transparent 60%)
          `,
        }}
      />
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex flex-col items-center justify-center">
        <HeroAtmosphere />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 w-full">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]"
            >
              <span className="text-[var(--text-1)]">Inteligência proprietária</span>
              <br />
              <span className="text-[var(--accent-1)]">para investidores.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="mt-6 text-lg md:text-xl text-[var(--text-2)] max-w-xl mx-auto leading-relaxed"
            >
              Scoring quantitativo proprietário, gestão de carteira,
              dados ao vivo e contexto macroeconômico.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.14 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/register">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Criar conta
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Explorar a demo
                </Button>
              </Link>
            </motion.div>
          </div>

        </div>

        {/* Continuous Conveyor Pipeline — full width, outside max-w container */}
        <div className="relative w-full px-4 sm:px-10 lg:px-12 pb-16 md:pb-24">
          <ScorePipeline />
          <MobileScorePipeline />
        </div>
      </section>

      {/* ─── Score Showcase — 3 Feature Cards ─────── */}
      <section id="aq-score" className="relative py-20 md:py-28">
        <DiagonalLines />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-sm font-medium tracking-widest uppercase text-[var(--accent-1)] mb-4">aQ Intelligence™</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Motor proprietário com calibração setorial.
            </h2>
            <p className="mt-3 text-[var(--text-2)] max-w-xl mx-auto">
              20 indicadores, calibração por setor, detecção de regime, diagnóstico IA e monitoramento em tempo real.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 — Score X-Ray */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <Image
                  src="https://icons.brapi.dev/icons/ITUB4.svg"
                  alt="ITUB4" width={28} height={28}
                  className="rounded-lg" unoptimized
                />
                <div>
                  <h3 className="text-sm font-bold">ITUB4</h3>
                  <p className="text-[10px] text-[var(--text-3)]">Itaú Unibanco</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xl font-bold font-mono text-[#00D4AA]">86</span>
                </div>
              </div>

              <div className="space-y-3">
                <PillarBar name="Valuation" value={81} delay={0} />
                <PillarBar name="Qualidade" value={100} delay={0.06} />
                <PillarBar name="Risco" value={100} delay={0.12} />
                <PillarBar name="Dividendos" value={84} delay={0.18} />
                <PillarBar name="Crescimento" value={97} delay={0.24} />
              </div>

              <p className="mt-5 text-xs text-[var(--text-3)] leading-relaxed">
                18 indicadores avaliados. Pesos calibrados por setor.
              </p>
            </motion.div>

            {/* Card 2 — 6 Perspectivas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-6"
            >
              <h3 className="text-sm font-bold mb-2">Lentes de investimento</h3>
              <p className="text-xs text-[var(--text-3)] mb-5">Mesmo ativo, perspectivas diferentes.</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {['Geral', 'Valor', 'Dividendos', 'Crescimento', 'Defensiva', 'Momento'].map((lens, i) => (
                  <span
                    key={lens}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                      i === 0
                        ? 'bg-[var(--accent-1)] text-white'
                        : 'border border-[var(--border-1)]/50 text-[var(--text-2)]'
                    }`}
                  >
                    {lens}
                  </span>
                ))}
              </div>

              <div className="space-y-2.5">
                {[
                  { lens: 'Geral', score: 86 },
                  { lens: 'Valor', score: 91 },
                  { lens: 'Dividendos', score: 78 },
                  { lens: 'Crescimento', score: 82 },
                  { lens: 'Defensiva', score: 88 },
                  { lens: 'Momento', score: 74 },
                ].map((item) => (
                  <div key={item.lens} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-2)]">{item.lens}</span>
                    <span className={`font-mono font-semibold ${getScoreTextClass(item.score)}`}>{item.score}</span>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-xs text-[var(--text-3)] leading-relaxed">
                Avalie cada ativo pela perspectiva que importa para sua estratégia.
              </p>
            </motion.div>

            {/* Card 3 — Drivers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-6 md:col-span-2 lg:col-span-1"
            >
              <h3 className="text-sm font-bold mb-2">Diagnóstico automático</h3>
              <p className="text-xs text-[var(--text-3)] mb-5">O que está impulsionando o score.</p>

              <div className="space-y-3">
                {[
                  { positive: true, text: 'ROE excepcional (21.3%)' },
                  { positive: true, text: 'Valuation atrativo (P/L 11)' },
                  { positive: true, text: 'Risco mínimo de endividamento' },
                  { positive: false, text: 'Dividendo abaixo da mediana' },
                  { positive: false, text: 'Crescimento de receita moderado' },
                ].map((driver, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="flex items-start gap-2.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className={`mt-0.5 flex-shrink-0 ${driver.positive ? 'stroke-emerald-500' : 'stroke-red-400'}`}
                    >
                      {driver.positive
                        ? <polyline points="20 6 9 17 4 12" />
                        : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                      }
                    </svg>
                    <span className={`text-sm ${driver.positive ? 'text-[var(--text-1)]' : 'text-[var(--text-2)]'}`}>
                      {driver.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              <p className="mt-5 text-xs text-[var(--text-3)] leading-relaxed">
                Entenda os motivos por trás de cada score.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Explorer Preview ────────────────────────── */}
      <section className="relative py-20 md:py-28">
        <HorizontalGrid />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm font-medium tracking-widest uppercase text-[var(--accent-1)] mb-4">Explorer</p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Ranking ao vivo. Filtragem inteligente.
            </h2>
            <p className="mt-3 text-[var(--text-2)] max-w-xl mx-auto">
              Ordene por score, filtre por setor, compare métricas. Dados 100% reais da CVM e B3.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-[var(--border-1)]/30 rounded-[var(--radius)] overflow-hidden bg-[var(--surface-1)]/50 backdrop-blur-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-1)]/30 text-[var(--text-3)] text-[11px] uppercase tracking-wider">
                    <th className="text-left py-3 px-4 font-medium">Ativo</th>
                    <th className="text-right py-3 px-3 font-medium">Preço</th>
                    <th className="text-right py-3 px-3 font-medium">Dia</th>
                    <th className="text-center py-3 px-3 font-medium">aQ Score</th>
                    <th className="text-center py-3 px-3 font-medium hidden sm:table-cell">Momento</th>
                    <th className="text-right py-3 px-3 font-medium hidden md:table-cell">P/L</th>
                    <th className="text-right py-3 px-3 font-medium hidden md:table-cell">ROE</th>
                    <th className="text-right py-3 px-3 font-medium hidden lg:table-cell">DY</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { tk: 'ITUB4', name: 'Itaú Unibanco', price: '34,50', ch: '+0.8%', up: true, sc: 86, mom: 'BULL' as const, pl: '11.0', roe: '21.3%', dy: '10.7%' },
                    { tk: 'PSSA3', name: 'Porto Seguro', price: '38,20', ch: '+1.2%', up: true, sc: 81, mom: 'BULL' as const, pl: '9.8', roe: '42.1%', dy: '5.4%' },
                    { tk: 'PRIO3', name: 'PetroRio', price: '44,15', ch: '+0.4%', up: true, sc: 79, mom: 'BULL' as const, pl: '5.2', roe: '32.5%', dy: '3.8%' },
                    { tk: 'CMIG4', name: 'Cemig', price: '11,80', ch: '-0.3%', up: false, sc: 78, mom: 'NEUTRO' as const, pl: '10.5', roe: '18.4%', dy: '8.2%' },
                    { tk: 'ITSA4', name: 'Itaúsa', price: '10,25', ch: '+0.5%', up: true, sc: 74, mom: 'NEUTRO' as const, pl: '8.9', roe: '15.2%', dy: '7.1%' },
                    { tk: 'VIVA3', name: 'Vivara', price: '23,40', ch: '+1.8%', up: true, sc: 73, mom: 'BULL' as const, pl: '10.8', roe: '26.2%', dy: '2.2%' },
                    { tk: 'BBDC4', name: 'Bradesco', price: '14,60', ch: '-0.5%', up: false, sc: 66, mom: 'NEUTRO' as const, pl: '8.6', roe: '13.4%', dy: '4.9%' },
                    { tk: 'VALE3', name: 'Vale', price: '56,30', ch: '-1.1%', up: false, sc: 65, mom: 'BEAR' as const, pl: '6.2', roe: '18.7%', dy: '8.5%' },
                  ].map((row, i) => (
                    <motion.tr
                      key={row.tk}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-[var(--border-1)]/20 last:border-0 hover:bg-[var(--surface-2)]/30"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Image
                            src={`https://icons.brapi.dev/icons/${row.tk}.svg`}
                            alt={row.tk} width={24} height={24}
                            className="rounded" unoptimized
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <div>
                            <span className="font-semibold text-[var(--text-1)]">{row.tk}</span>
                            <span className="text-[var(--text-3)] text-xs block">{row.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-3 font-mono text-[var(--text-1)]">R$ {row.price}</td>
                      <td className={`text-right py-3 px-3 font-mono ${row.up ? 'text-teal' : 'text-red'}`}>{row.ch}</td>
                      <td className="text-center py-3 px-3">
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${getScoreBgClass(row.sc)} ${getScoreTextClass(row.sc)}`}>{row.sc}</span>
                      </td>
                      <td className="text-center py-3 px-3 hidden sm:table-cell">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          row.mom === 'BULL' ? 'text-emerald-600 bg-emerald-500/10' :
                          row.mom === 'BEAR' ? 'text-red-500 bg-red-500/10' :
                          'text-[var(--text-3)] bg-[var(--surface-2)]'
                        }`}>{row.mom}</span>
                      </td>
                      <td className="text-right py-3 px-3 font-mono text-[var(--text-2)] hidden md:table-cell">{row.pl}</td>
                      <td className="text-right py-3 px-3 font-mono text-[var(--text-2)] hidden md:table-cell">{row.roe}</td>
                      <td className="text-right py-3 px-3 font-mono text-[var(--text-2)] hidden lg:table-cell">{row.dy}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border-1)]/20 text-center">
              <Link href="/explorer" className="text-sm text-[var(--accent-1)] hover:text-[var(--accent-1)]/80 transition-colors">
                Explorar todos os ativos →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Platform Features — Seções alternadas com previews ─ */}
      <section id="features" className="py-20 md:py-28 space-y-24 md:space-y-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold">Plataforma completa.</h2>
            <p className="mt-3 text-[var(--text-2)] max-w-xl mx-auto">
              Tudo que um investidor quantitativo precisa, em um só lugar.
            </p>
          </motion.div>

          {/* ── A: Gestão de Carteira ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-1)] mb-3">Portfólio</p>
              <h3 className="text-2xl font-bold mb-3">Gestão de Carteira Inteligente</h3>
              <p className="text-[var(--text-2)] leading-relaxed mb-5">
                Acompanhe sua carteira com precisão. Cálculo FIFO automático, benchmarks contra CDI e IBOV, e visualização de alocação por setor.
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {['Cálculo FIFO para custo médio', 'Benchmarks CDI e IBOV em tempo real', 'Alocação treemap por ativo e setor', 'Exportar dados em CSV'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-1)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-5">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="text-xs text-[var(--text-3)] mb-0.5">Patrimônio</p>
                  <p className="text-xl font-bold font-mono">R$ 48.250,00</p>
                </div>
                <span className="text-sm font-mono text-emerald-500">+12,4%</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'vs CDI', value: '+4,2 pp', color: 'text-emerald-500' },
                  { label: 'vs IBOV', value: '+6,8 pp', color: 'text-emerald-500' },
                  { label: 'Score Médio', value: '76', color: 'text-[var(--accent-1)]' },
                ].map((kpi) => (
                  <div key={kpi.label} className="text-center">
                    <p className="text-[10px] text-[var(--text-3)]">{kpi.label}</p>
                    <p className={`text-sm font-bold font-mono ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                {[
                  { name: 'WEGE3', pct: 28, color: 'bg-[var(--accent-1)]' },
                  { name: 'ITSA4', pct: 22, color: 'bg-emerald-500' },
                  { name: 'PRIO3', pct: 20, color: 'bg-teal-500' },
                  { name: 'EQTL3', pct: 18, color: 'bg-blue-500' },
                  { name: 'GMAT3', pct: 12, color: 'bg-purple-500' },
                ].map((a) => (
                  <div key={a.name} className={`${a.color} rounded h-2`} style={{ width: `${a.pct}%` }} title={`${a.name}: ${a.pct}%`} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── B: Carteiras Inteligentes ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="order-2 lg:order-1 border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { mode: 'Valor', score: 82, color: 'border-emerald-500/40' },
                  { mode: 'Dividendos', score: 78, color: 'border-teal-500/40' },
                  { mode: 'Crescimento', score: 75, color: 'border-blue-500/40' },
                  { mode: 'Fortaleza', score: 80, color: 'border-purple-500/40' },
                  { mode: 'Momento', score: 71, color: 'border-amber-500/40' },
                ].map((m) => (
                  <div key={m.mode} className={`border ${m.color} rounded-lg p-3 text-center`}>
                    <p className="text-xs font-semibold mt-1">{m.mode}</p>
                    <p className={`text-sm font-bold font-mono mt-0.5 ${getScoreTextClass(m.score)}`}>{m.score}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text-3)] text-center mt-3">
                Motor seleciona automaticamente baseado em critérios quantitativos
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-1)] mb-3">Smart Portfolios</p>
              <h3 className="text-2xl font-bold mb-3">Carteiras Inteligentes</h3>
              <p className="text-[var(--text-2)] leading-relaxed mb-5">
                5 modos de investimento com seleção automática. O motor aplica critérios quantitativos para montar a carteira ideal para cada estratégia.
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {['Valor: P/L baixo + ROE alto', 'Dividendos: DY consistente + payout saudável', 'Crescimento: CAGR receita + expansão margem', 'Fortaleza: baixo endividamento + liquidez'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-1)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* ── C: Contexto Macro ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-1)] mb-3">Macro</p>
              <h3 className="text-2xl font-bold mb-3">Contexto Macro + Previsões</h3>
              <p className="text-[var(--text-2)] leading-relaxed mb-5">
                Mercados de previsão (Kalshi) alimentam o sentimento macro. Scores ajustados automaticamente pelo contexto econômico.
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {['SELIC, IPCA, USD em tempo real via BCB', 'Sentimento macro: otimista/neutro/pessimista', 'Scores ajustados pelo contexto', 'Previsões de mercado com probabilidades'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-1)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-5">
              <p className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Sentimento Macro</p>
              <div className="h-3 rounded-full overflow-hidden flex mb-3">
                <div className="bg-emerald-500/80 h-full" style={{ width: '55%' }} />
                <div className="bg-amber-400/80 h-full" style={{ width: '30%' }} />
                <div className="bg-red-400/80 h-full" style={{ width: '15%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--text-3)] mb-5">
                <span>Otimista 55%</span>
                <span>Neutro 30%</span>
                <span>Pessimista 15%</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'SELIC', value: '13,25%', sub: 'Meta Copom' },
                  { label: 'IPCA', value: '4,56%', sub: '12 meses' },
                  { label: 'USD/BRL', value: 'R$ 5,72', sub: 'Câmbio' },
                  { label: 'IBOV', value: '128.450', sub: '+0,8% dia' },
                ].map((ind) => (
                  <div key={ind.label} className="bg-[var(--bg)]/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-[var(--text-3)]">{ind.label}</p>
                    <p className="text-sm font-bold font-mono">{ind.value}</p>
                    <p className="text-[9px] text-[var(--text-3)]">{ind.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── D: Dividendos e FIRE ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="order-2 lg:order-1 border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-5">
              <div className="flex items-baseline justify-between mb-4">
                <p className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider">Projeção FIRE</p>
                <span className="text-xs text-emerald-500 font-mono">15 anos</span>
              </div>
              <div className="h-24 flex items-end gap-1 mb-3">
                {[12, 18, 26, 35, 48, 62, 80, 100].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-[var(--accent-1)]/20 relative" style={{ height: `${h}%` }}>
                    <div className="absolute bottom-0 inset-x-0 rounded-t bg-emerald-500/40" style={{ height: `${h * 0.6}%` }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-[var(--text-3)]">Renda/mês</p>
                  <p className="text-sm font-bold font-mono text-emerald-500">R$ 3.200</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-3)]">DY médio</p>
                  <p className="text-sm font-bold font-mono">7,2%</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-3)]">Meta FIRE</p>
                  <p className="text-sm font-bold font-mono text-[var(--accent-1)]">42%</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-1)] mb-3">Renda Passiva</p>
              <h3 className="text-2xl font-bold mb-3">Dividendos e Metas FIRE</h3>
              <p className="text-[var(--text-2)] leading-relaxed mb-5">
                Calendário de proventos, projeção de renda passiva com reinvestimento, e calculadora FIRE para planejar sua independência financeira.
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {['Calendário forward de dividendos', 'Simulação com reinvestimento composto', 'Yield on cost da carteira', 'Calculadora FIRE personalizada'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-1)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* ── E: Radar ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-1)] mb-3">Radar</p>
              <h3 className="text-2xl font-bold mb-3">Radar de Oportunidades</h3>
              <p className="text-[var(--text-2)] leading-relaxed mb-5">
                Alertas inteligentes quando scores mudam, ativos entram em nova classificação, ou o mercado apresenta oportunidades.
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {['Alertas de mudança de score', 'Oportunidades detectadas pelo motor', 'Saúde geral da carteira', 'Notícias filtradas por relevância'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-1)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-5 space-y-3">
              {[
                { type: 'upgrade', text: 'WEGE3 subiu para Excepcional (85)', time: '2h', color: 'text-emerald-500 bg-emerald-500/10' },
                { type: 'alert', text: 'VALE3 caiu 3.2% — Score estável em 65', time: '4h', color: 'text-amber-500 bg-amber-500/10' },
                { type: 'opp', text: 'PSSA3 com score 81 e P/L abaixo da mediana', time: '6h', color: 'text-[var(--accent-1)] bg-[var(--accent-1)]/10' },
                { type: 'risk', text: 'MGLU3 rebaixado para Crítico (42)', time: '1d', color: 'text-red-400 bg-red-400/10' },
              ].map((event) => (
                <div key={event.text} className="flex items-start gap-3 py-2">
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${event.color}`}>
                    {event.type === 'upgrade' ? 'UPGRADE' : event.type === 'alert' ? 'ALERTA' : event.type === 'opp' ? 'OPORTUNIDADE' : 'RISCO'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-1)] truncate">{event.text}</p>
                  </div>
                  <span className="text-[10px] text-[var(--text-3)] whitespace-nowrap">{event.time}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── F: Análise Profunda ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="order-2 lg:order-1 border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { ticker: 'WEGE3', score: 85 },
                  { ticker: 'TOTS3', score: 81 },
                ].map((a) => (
                  <div key={a.ticker}>
                    <div className="flex items-center gap-2 mb-3">
                      <Image src={`https://icons.brapi.dev/icons/${a.ticker}.svg`} alt={a.ticker} width={20} height={20} className="rounded" unoptimized onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <span className="text-sm font-bold">{a.ticker}</span>
                      <span className={`text-xs font-bold font-mono ml-auto ${getScoreTextClass(a.score)}`}>{a.score}</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { name: 'Val', v: a.ticker === 'WEGE3' ? 35 : 42 },
                        { name: 'Qual', v: a.ticker === 'WEGE3' ? 95 : 90 },
                        { name: 'Risco', v: a.ticker === 'WEGE3' ? 92 : 88 },
                        { name: 'Div', v: a.ticker === 'WEGE3' ? 45 : 38 },
                        { name: 'Cresc', v: a.ticker === 'WEGE3' ? 92 : 95 },
                      ].map((p) => (
                        <div key={p.name} className="flex items-center gap-2">
                          <span className="text-[9px] text-[var(--text-3)] w-8">{p.name}</span>
                          <div className="flex-1 h-1 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div className={`h-full rounded-full ${getScoreBgClass(p.v)}`} style={{ width: `${p.v}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-1)] mb-3">Deep Analysis</p>
              <h3 className="text-2xl font-bold mb-3">Análise Profunda</h3>
              <p className="text-[var(--text-2)] leading-relaxed mb-5">
                Compare até 4 ativos pilar por pilar. X-Ray do score mostra cada indicador e sua contribuição. Entenda exatamente por que o motor recomenda.
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {['Comparação lado a lado (até 4 ativos)', 'X-Ray: 18 indicadores detalhados (Elite)', 'Diagnóstico IA com drivers positivos/negativos', 'Research Notes geradas pelo motor'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-1)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Social Proof ──────────────────────────────── */}
      <section className="py-16 border-t border-b border-[var(--border-1)]/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
          >
            <div>
              <p className="text-3xl font-bold font-mono text-[var(--accent-1)]">384+</p>
              <p className="text-sm text-[var(--text-2)] mt-1">Ações da B3 analisadas em tempo real</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-emerald-500">+10,5%</p>
              <p className="text-sm text-[var(--text-2)] mt-1">Alpha sobre o IBOV no backtest</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-[var(--text-1)]">100%</p>
              <p className="text-sm text-[var(--text-2)] mt-1">Dados reais — CVM, BCB, brapi, Kalshi</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Planos ────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold">Planos</h2>
            <p className="mt-3 text-[var(--text-2)]">Comece grátis. Evolua quando precisar.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                name: 'Free',
                price: 'R$ 0',
                features: ['Explorer + aQ Score', 'Até 5 ativos em detalhe', 'Dados em tempo real', 'Comparação básica'],
                highlight: false,
              },
              {
                name: 'Pro',
                price: 'R$ 39/mês',
                features: ['Tudo do Free +', 'Carteiras ilimitadas', 'Metas e FIRE', 'Dividendos completos', 'Radar de oportunidades'],
                highlight: true,
              },
              {
                name: 'Elite',
                price: 'R$ 79/mês',
                features: ['Tudo do Pro +', 'X-Ray do Score', 'Diagnóstico IA', 'Monte Carlo', 'Research Notes', 'Comunidade'],
                highlight: false,
              },
            ].map((plan) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`rounded-[var(--radius)] p-6 border ${
                  plan.highlight
                    ? 'border-[var(--accent-1)]/50 bg-[var(--accent-1)]/5 ring-1 ring-[var(--accent-1)]/20'
                    : 'border-[var(--border-1)]/30 bg-[var(--surface-1)]/50'
                }`}
              >
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold font-mono mb-4">{plan.price}</p>
                <ul className="space-y-2 text-sm text-[var(--text-2)]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 flex-shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link href="/pricing" className="text-sm text-[var(--accent-1)] hover:text-[var(--accent-1)]/80 transition-colors">
              Ver detalhes dos planos →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 border-t border-[var(--border-1)]/30 overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[var(--accent-1)]/[0.03] rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Conheça a plataforma.
          </h2>
          <p className="mt-4 text-[var(--text-2)] max-w-lg mx-auto">
            Acesse a demonstração e explore todas as funcionalidades.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button variant="primary" size="lg">Criar conta</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">Explorar a demo</Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  )
}
