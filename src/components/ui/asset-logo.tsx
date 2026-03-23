'use client'

import Image from 'next/image'
import { useState } from 'react'

interface AssetLogoProps {
  ticker: string
  logo?: string | null | undefined
  size?: number
  className?: string
}

// Always construct logo URL from ticker — brapi CDN pattern: icons.brapi.dev/icons/{TICKER}.svg
function getLogoUrl(ticker: string): string {
  return `https://icons.brapi.dev/icons/${ticker}.svg`
}

export function AssetLogo({ ticker, size = 28, className = '' }: AssetLogoProps) {
  const [error, setError] = useState(false)
  const initials = ticker.slice(0, 2)

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-cyan-950/60 text-cyan-400 font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.36 }}
      >
        {initials}
      </div>
    )
  }

  return (
    <Image
      src={getLogoUrl(ticker)}
      alt={ticker}
      width={size}
      height={size}
      className={`rounded-md shrink-0 object-contain ${className}`}
      unoptimized
      onError={() => setError(true)}
    />
  )
}
