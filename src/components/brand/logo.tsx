'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'full' | 'symbol' | 'wordmark' | 'horizontal' | 'stacked'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animated?: boolean
}

const sizes = {
  xs: { symbol: 24, fontSize: 18, gap: 'gap-1' },
  sm: { symbol: 40, fontSize: 32, gap: 'gap-1.5' },
  md: { symbol: 40, fontSize: 32, gap: 'gap-2' },
  lg: { symbol: 48, fontSize: 48, gap: 'gap-2.5' },
  xl: { symbol: 64, fontSize: 64, gap: 'gap-3' },
}

// Brand colors
const COLORS = {
  electricBlue: '#1A73E8',
  white: '#FFFFFF',
}

// The aQ Symbol - official brand badge
export function AQSymbol({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="aQ-Invest symbol"
      className={cn(animated && 'group transition-transform duration-300 hover:scale-105')}
    >
      <rect x="4" y="4" width="48" height="48" rx="12" fill={COLORS.electricBlue} />
      <text
        x="28"
        y="38"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        fontWeight="700"
        fontSize="26"
        fill={COLORS.white}
        textAnchor="middle"
      >
        aQ
      </text>
    </svg>
  )
}

// Wordmark component - typography only
// When withSymbol=true, shows only "-Invest" (symbol already provides "aQ")
// When withSymbol=false, shows full "aQ-Invest"
export function AQWordmark({
  fontSize = 32,
  className,
  withSymbol = false,
}: {
  fontSize?: number
  className?: string
  withSymbol?: boolean
}) {
  return (
    <span
      className={cn('inline-flex items-baseline', className)}
      style={{
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        fontWeight: 700,
        fontSize: `${fontSize}px`,
        letterSpacing: '-0.04em',
      }}
    >
      {!withSymbol && <span style={{ color: COLORS.electricBlue }}>aQ</span>}
      <span style={{ color: 'var(--logo-text-color, #0F2B46)' }}>{withSymbol ? 'Invest' : '-Invest'}</span>
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
        opacity: 0.6,
        color: 'var(--logo-text-color, #0F2B46)',
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
  animated = false
}: LogoProps) {
  const sizeConfig = sizes[size]

  // Symbol only
  if (variant === 'symbol') {
    return (
      <div className={className}>
        <AQSymbol size={sizeConfig.symbol} animated={animated} />
      </div>
    )
  }

  // Wordmark only
  if (variant === 'wordmark') {
    return <AQWordmark fontSize={sizeConfig.fontSize} className={className} />
  }

  // Horizontal: Symbol + Wordmark
  if (variant === 'horizontal') {
    return (
      <div className={cn('flex items-center', sizeConfig.gap, className)}>
        <AQSymbol size={Math.round(sizeConfig.fontSize * 1.1)} animated={animated} />
        <AQWordmark fontSize={sizeConfig.fontSize * 0.75} withSymbol />
      </div>
    )
  }

  // Stacked: Symbol + Wordmark + Tagline
  if (variant === 'stacked') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <AQSymbol size={sizeConfig.symbol * 1.2} animated={animated} />
        <AQWordmark fontSize={sizeConfig.fontSize * 0.7} withSymbol />
        <Tagline />
      </div>
    )
  }

  // Full logo (default) - same as horizontal
  return (
    <div className={cn('flex items-center', sizeConfig.gap, className)}>
      <AQSymbol size={sizeConfig.symbol} animated={animated} />
      <AQWordmark fontSize={sizeConfig.fontSize * 0.75} withSymbol />
    </div>
  )
}

export default Logo
