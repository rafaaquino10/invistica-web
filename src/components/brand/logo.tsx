'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'full' | 'symbol' | 'wordmark' | 'horizontal' | 'stacked'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animated?: boolean
}

const sizes = {
  xs: { text: 12, badge: 11, badgePad: '1px 3px', gap: 3, symbol: 24 },
  sm: { text: 14, badge: 13, badgePad: '2px 4px', gap: 4, symbol: 32 },
  md: { text: 16, badge: 15, badgePad: '2px 5px', gap: 5, symbol: 40 },
  lg: { text: 22, badge: 20, badgePad: '3px 6px', gap: 6, symbol: 48 },
  xl: { text: 28, badge: 26, badgePad: '3px 8px', gap: 6, symbol: 64 },
}

// Brand colors — Volt Carbon identity
const VOLT = '#d0f364'
const DARK = '#050505'

// The IQ Symbol — standalone badge (square with "IQ")
export function IQSymbol({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="InvestIQ symbol"
      className={cn(animated && 'transition-transform duration-300 hover:scale-105')}
    >
      <rect x="4" y="4" width="48" height="48" rx="10" fill={VOLT} />
      <text
        x="28"
        y="37"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        fontWeight="900"
        fontSize="24"
        fill={DARK}
        textAnchor="middle"
      >
        IQ
      </text>
    </svg>
  )
}

// InvestIQ wordmark: "Invest" text + "IQ" badge inline
export function IQWordmark({
  fontSize = 16,
  className,
}: {
  fontSize?: number
  className?: string
}) {
  const badgeSize = Math.round(fontSize * 0.9)
  const gap = Math.round(fontSize * 0.25)

  return (
    <span
      className={cn('inline-flex items-center', className)}
      style={{ gap: `${gap}px` }}
    >
      <span
        style={{
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          fontWeight: 700,
          fontSize: `${fontSize}px`,
          letterSpacing: '-0.02em',
          color: 'var(--text-1, #F8FAFC)',
          lineHeight: 1,
        }}
      >
        Invest
      </span>
      <span
        style={{
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          fontWeight: 900,
          fontSize: `${badgeSize}px`,
          color: DARK,
          background: VOLT,
          borderRadius: '4px',
          padding: `${Math.max(1, Math.round(fontSize * 0.1))}px ${Math.round(fontSize * 0.3)}px`,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        IQ
      </span>
    </span>
  )
}

// Tagline component
export function Tagline({ className }: { className?: string }) {
  return (
    <span
      className={cn('block', className)}
      style={{
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        fontSize: '13px',
        fontWeight: 400,
        letterSpacing: '0.02em',
        opacity: 0.5,
        color: 'var(--text-2, #A0A8B8)',
      }}
    >
      Inteligência que valoriza.
    </span>
  )
}

export function Logo({
  variant = 'full',
  size = 'md',
  className,
  animated = false,
}: LogoProps) {
  const s = sizes[size]

  // Symbol only — the IQ badge standalone
  if (variant === 'symbol') {
    return (
      <div className={className}>
        <IQSymbol size={s.symbol} animated={animated} />
      </div>
    )
  }

  // Wordmark only — "Invest" + IQ badge
  if (variant === 'wordmark') {
    return <IQWordmark fontSize={s.text} className={className} />
  }

  // Stacked: Symbol + Wordmark + Tagline
  if (variant === 'stacked') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <IQSymbol size={Math.round(s.symbol * 1.2)} animated={animated} />
        <IQWordmark fontSize={Math.round(s.text * 0.85)} />
        <Tagline />
      </div>
    )
  }

  // Full / Horizontal — the standard logo: "Invest" + IQ badge
  return <IQWordmark fontSize={s.text} className={className} />
}

export default Logo
