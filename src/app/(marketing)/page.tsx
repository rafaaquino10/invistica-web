'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Button } from '@/components/ui'
import { IQSymbol } from '@/components/brand'
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
        {/* Center — IQ Score Engine (absolutely centered on page) */}
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
            <IQSymbol size={96} />
          </motion.div>

          <span className="mt-3 text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--accent-1)]/70">
            IQ-Cognit™
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

        {/* Center — IQ Score Engine */}
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
            <IQSymbol size={56} />
          </motion.div>
          <span className="mt-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--accent-1)]/70">
            IQ-Cognit™
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

      {/* ─── Motor IQ-Cognit — 3 Pilares ──────────── */}
      <section id="motor" className="relative py-20 md:py-28 border-t border-[var(--border-1)]/20">
        <DiagonalLines />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-sm font-medium tracking-widest uppercase text-[var(--accent-1)] mb-4">IQ-Cognit v11 Adaptive Apex</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              3 pilares. 9 setores. Regime-aware.
            </h2>
            <p className="mt-3 text-[var(--text-2)] max-w-2xl mx-auto">
              Motor quantamental que combina scoring quantitativo, analise qualitativa por IA e valuation multi-modelo. Calibrado por setor, ajustado pelo regime macro, com gatekeeper de 3 camadas.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pilar 1 — Quantitativo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-1)]/10 flex items-center justify-center mb-4">
                <span className="text-[var(--accent-1)] font-bold text-lg font-mono">Q</span>
              </div>
              <h3 className="text-sm font-bold mb-2">Pilar Quantitativo</h3>
              <p className="text-xs text-[var(--text-2)] leading-relaxed mb-4">
                5 sub-scores: Qualidade (ROE, ROIC, Piotroski), Risco (Altman, Merton PD), Valuation (multiplos vs setor), Crescimento (CAGR 5a), Momento (RSI, MA).
              </p>
              <div className="space-y-2">
                <PillarBar name="Qualidade" value={88} delay={0} />
                <PillarBar name="Risco" value={92} delay={0.06} />
                <PillarBar name="Valuation" value={72} delay={0.12} />
                <PillarBar name="Crescimento" value={65} delay={0.18} />
                <PillarBar name="Momento" value={78} delay={0.24} />
              </div>
            </motion.div>

            {/* Pilar 2 — Qualitativo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center mb-4">
                <span className="text-teal font-bold text-lg font-mono">AI</span>
              </div>
              <h3 className="text-sm font-bold mb-2">Pilar Qualitativo (IA)</h3>
              <p className="text-xs text-[var(--text-2)] leading-relaxed mb-4">
                6 dimensoes avaliadas por IA: pricing power, alocacao de capital, credibilidade da gestao, resiliencia, posicionamento competitivo e governanca.
              </p>
              <div className="space-y-2.5">
                {['Pricing Power', 'Alocacao Capital', 'Gestao', 'Resiliencia', 'Competitividade', 'Governanca'].map((dim, i) => (
                  <div key={dim} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-2)]">{dim}</span>
                    <span className="font-mono font-bold text-teal">FORTE</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Pilar 3 — Valuation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center mb-4">
                <span className="text-amber font-bold text-lg font-mono">$</span>
              </div>
              <h3 className="text-sm font-bold mb-2">Pilar Valuation</h3>
              <p className="text-xs text-[var(--text-2)] leading-relaxed mb-4">
                4 modelos combinados: DCF (5 anos), Gordon DDM, Multiplos relativos ao setor, Monte Carlo (10.000 simulacoes). Fair value com bandas P25/P75.
              </p>
              <div className="space-y-3">
                {[
                  { label: 'DCF', value: 'R$ 42,80' },
                  { label: 'Gordon', value: 'R$ 39,50' },
                  { label: 'Multiplos', value: 'R$ 44,20' },
                  { label: 'Fair Value Final', value: 'R$ 42,10', highlight: true },
                  { label: 'Preco Atual', value: 'R$ 33,12', current: true },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-2)]">{m.label}</span>
                    <span className={`font-mono font-bold ${(m as any).highlight ? 'text-[var(--accent-1)]' : (m as any).current ? 'text-[var(--text-1)]' : 'text-[var(--text-2)]'}`}>{m.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[var(--border-1)]/30 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-3)]">Margem de Seguranca</span>
                  <span className="font-mono font-bold text-teal">+27,1%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Plataforma Completa — 4 Features ─────── */}
      <section id="features" className="py-20 md:py-28 space-y-20 md:space-y-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Plataforma completa. Zero gordura.</h2>
            <p className="mt-3 text-[var(--text-2)] max-w-2xl mx-auto">
              Dashboard com sinais do motor, explorer com 6 lentes, analise profunda por ativo com 5 tabs, estrategias autonomas e backtest validado.
            </p>
          </motion.div>

          {/* Feature A: Dashboard + Signal Card */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-1)] mb-3">Dashboard</p>
              <h3 className="text-2xl font-bold mb-3">Centro de Comando</h3>
              <p className="text-[var(--text-2)] leading-relaxed mb-5">
                KPIs da carteira, performance vs benchmarks, sinais de compra/venda do motor estrategico e regime macro em uma unica tela.
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {['Signal Card com confianca % e vol stress', 'Regime Strip: SELIC, IPCA, USD, Brent ao vivo', 'Performance vs CDI e IBOV com periodo configuravel', 'Oportunidades rankeadas pelo motor IQ-Cognit'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[var(--accent-1)]" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] text-[var(--text-3)]">Patrimonio</p>
                  <p className="text-xl font-bold font-mono">R$ 127.450</p>
                </div>
                <span className="text-sm font-mono text-emerald-500">+18,7%</span>
              </div>
              <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-teal/5 border border-teal/20">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal/10 text-teal">5 COMPRA</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red/10 text-red">1 VENDA</span>
                <span className="text-xs text-[var(--text-3)] ml-auto">Conf. 78%</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[var(--text-3)]">
                <span>RISK_ON</span><span>SELIC 14.25%</span><span>IPCA 4.2%</span><span>USD 5.68</span>
              </div>
            </div>
          </motion.div>

          {/* Feature B: Explorer */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                {['Geral', 'Valor', 'Dividendos', 'Crescimento', 'Defensiva', 'Momento'].map((lens, i) => (
                  <span key={lens} className={`text-xs px-3 py-1.5 rounded-full font-medium ${i === 0 ? 'bg-[var(--accent-1)] text-white' : 'border border-[var(--border-1)]/50 text-[var(--text-2)]'}`}>{lens}</span>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { tk: 'ITUB4', sc: 86, rating: 'STRONG_BUY', margin: '+27%' },
                  { tk: 'WEGE3', sc: 85, rating: 'STRONG_BUY', margin: '+12%' },
                  { tk: 'TAEE11', sc: 82, rating: 'STRONG_BUY', margin: '+31%' },
                  { tk: 'BBSE3', sc: 80, rating: 'BUY', margin: '+18%' },
                ].map(row => (
                  <div key={row.tk} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--border-1)]/10">
                    <span className="font-mono font-bold w-16">{row.tk}</span>
                    <span className={`font-mono font-bold ${getScoreTextClass(row.sc)}`}>{row.sc}</span>
                    <span className="text-[var(--text-3)] w-24 text-center">{row.rating}</span>
                    <span className="font-mono text-teal">{row.margin}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-1)] mb-3">Explorer</p>
              <h3 className="text-2xl font-bold mb-3">6 Lentes. Colunas Dinamicas.</h3>
              <p className="text-[var(--text-2)] leading-relaxed mb-5">
                Screener com colunas que mudam automaticamente conforme a lente selecionada. IQ Score, Rating, Fair Value, Margem de Seguranca, DY Projetado e Safety Score.
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {['Colunas dinamicas por lens (valor, dividendos, growth...)', 'Tooltips educativos em cada metrica', 'Filtros por setor, score minimo, DY', 'Export CSV e atalhos de teclado (j/k/Enter)'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[var(--accent-1)]" />{item}</li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Feature C: Asset Detail Tabs */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-1)] mb-3">Analise do Ativo</p>
              <h3 className="text-2xl font-bold mb-3">5 Tabs. Tudo Sobre o Ativo.</h3>
              <p className="text-[var(--text-2)] leading-relaxed mb-5">
                Hero com preco + IQ Score + cotacao ao vivo. 5 tabs organizadas: Visao Geral, Valuation (Fair Value Strip + DCF + Monte Carlo + Institutional Holders), Dividendos, Score (X-Ray + Thesis + Dossier IA), Noticias.
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {['Fair Value: DCF + Gordon + Multiplos + Monte Carlo P25/P75', 'Institutional Holders (CVM) + Short Interest (B3)', 'Dividend Safety Score + Trap Detection', '6 dimensoes qualitativas avaliadas por IA'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[var(--accent-1)]" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-1)]/10 flex items-center justify-center">
                  <span className="text-[var(--accent-1)] font-bold text-sm font-mono">IQ</span>
                </div>
                <div>
                  <span className="font-mono font-bold">ITUB4</span>
                  <span className="block text-[10px] text-[var(--text-3)]">Itau Unibanco</span>
                </div>
                <span className="ml-auto text-xl font-bold font-mono text-[#00D4AA]">86</span>
              </div>
              <div className="flex gap-1 mb-4">
                {['Visao Geral', 'Valuation', 'Dividendos', 'Score', 'Noticias'].map((tab, i) => (
                  <span key={tab} className={`text-[9px] px-2 py-1 rounded ${i === 1 ? 'bg-[var(--accent-1)] text-white' : 'text-[var(--text-3)]'}`}>{tab}</span>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Fair Value DCF', value: 'R$ 42,80', color: 'text-teal' },
                  { label: 'Fair Value Gordon', value: 'R$ 39,50', color: 'text-teal' },
                  { label: 'Preco Atual', value: 'R$ 33,12', color: 'text-[var(--text-1)]' },
                  { label: 'Margem Seguranca', value: '+27,1%', color: 'text-teal font-bold' },
                  { label: 'Prob. Upside', value: '74%', color: 'text-[var(--accent-1)]' },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-3)]">{m.label}</span>
                    <span className={`font-mono ${m.color}`}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Feature D: Estrategias + Backtest */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)]/50 p-5">
              <p className="text-[10px] font-bold text-[var(--accent-1)] uppercase tracking-wider mb-3">Motor Autonomo — Backtest v11</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'CAGR', value: '21,2%', color: 'text-teal' },
                  { label: 'Alpha vs IBOV', value: '+15,4% a.a.', color: 'text-teal' },
                  { label: 'Sharpe', value: '0,67', color: 'text-[var(--text-1)]' },
                  { label: 'Max DD', value: '-37,2%', color: 'text-red' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className="text-[10px] text-[var(--text-3)]">{m.label}</p>
                    <p className={`text-sm font-bold font-mono ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text-3)] text-center">2012-2025 | R$1M → R$12,79M | Walk-forward validado</p>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-1)] mb-3">Estrategias IQ + Lab</p>
              <h3 className="text-2xl font-bold mb-3">Motor Autonomo. Backtest Validado.</h3>
              <p className="text-[var(--text-2)] leading-relaxed mb-5">
                Motor estrategico com alocacao otima, short candidates e carteiras inteligentes. Backtest walk-forward de 13 anos com custos reais, impostos e survivorship bias.
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {['Alocacao otima com sinais BUY/SELL/HOLD/ROTATE', 'Short candidates quando regime permite', 'Backtest configuravel: monthly/quarterly, leverage, benchmarks', 'Transparencia total: IC Spearman, hit rate, signal decay'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[var(--accent-1)]" />{item}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Numeros do Motor ──────────────────────────── */}
      <section className="py-16 border-t border-b border-[var(--border-1)]/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold font-mono text-[var(--accent-1)]">947</p>
              <p className="text-sm text-[var(--text-2)] mt-1">Acoes analisadas diariamente</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-teal">+15,4%</p>
              <p className="text-sm text-[var(--text-2)] mt-1">Alpha a.a. vs IBOV (2012-2025)</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-[var(--text-1)]">40+</p>
              <p className="text-sm text-[var(--text-2)] mt-1">Endpoints do motor IQ-Cognit</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-amber">4</p>
              <p className="text-sm text-[var(--text-2)] mt-1">Modelos de valuation combinados</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                name: 'Free',
                price: 'R$ 0',
                features: ['Explorer com ranking ao vivo', 'Cotacoes e historico', 'Financials (CVM)', 'Peers e comparacao basica', 'Dividendos historico'],
                highlight: false,
              },
              {
                name: 'Pro',
                price: 'R$ 59,90/mes',
                features: ['Tudo do Free +', 'IQ Score + Rating + 3 pilares', 'Fair Value (DCF, Gordon, Multiplos, Monte Carlo)', 'Dividend Safety + Trap Detection', 'Estrategias IQ + Alocacao Otima', 'Backtest Lab completo', 'Radar com 8 tipos de alerta', 'Institutional Holders + Short Interest', 'X-Ray, Dossier IA, Thesis, Evidence Explorer'],
                highlight: true,
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
            Comece a investir com inteligencia.
          </h2>
          <p className="mt-4 text-[var(--text-2)] max-w-lg mx-auto">
            947 acoes analisadas diariamente. 3 pilares. 4 modelos de valuation. Motor autonomo com 21,2% CAGR validado. Acesse agora.
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
