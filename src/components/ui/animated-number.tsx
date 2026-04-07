'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  duration?: number
  delay?: number
  className?: string
  formatOptions?: Intl.NumberFormatOptions
  locale?: string
  prefix?: string
  suffix?: string
  decimals?: number
}

export function AnimatedNumber({
  value,
  duration = 1000,
  delay = 0,
  className,
  formatOptions,
  locale = 'pt-BR',
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)
  const startTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            startAnimation()
          }
        })
      },
      { threshold: 0.1 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      observer.disconnect()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, hasAnimated])

  const startAnimation = () => {
    const startValue = 0
    const endValue = value

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp + delay
      }

      const elapsed = timestamp - startTimeRef.current

      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const progress = Math.min(elapsed / duration, 1)
      // Easing function: easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

      const currentValue = startValue + (endValue - startValue) * easeProgress
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  const formattedValue = formatOptions
    ? new Intl.NumberFormat(locale, formatOptions).format(displayValue)
    : decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString(locale)

  return (
    <span ref={elementRef} className={cn('animate-number font-mono tabular-nums', className)}>
      {prefix}{formattedValue}{suffix}
    </span>
  )
}

// Currency variant for Brazilian Real
interface AnimatedCurrencyProps {
  value: number
  duration?: number
  delay?: number
  className?: string
  compact?: boolean
  showCents?: boolean
}

export function AnimatedCurrency({
  value,
  duration = 1000,
  delay = 0,
  className,
  compact = false,
  showCents = false,
}: AnimatedCurrencyProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)
  const startTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            startAnimation()
          }
        })
      },
      { threshold: 0.1 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      observer.disconnect()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, hasAnimated])

  const startAnimation = () => {
    const startValue = 0
    const endValue = value

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp + delay
      }

      const elapsed = timestamp - startTimeRef.current

      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

      const currentValue = startValue + (endValue - startValue) * easeProgress
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  const formatValue = (val: number): string => {
    if (compact && val >= 1000000) {
      return `R$ ${(val / 1000000).toFixed(1).replace('.', ',')}M`
    }
    if (compact && val >= 1000) {
      return `R$ ${(val / 1000).toFixed(0)}k`
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    }).format(val)
  }

  return (
    <span ref={elementRef} className={cn('animate-number font-mono tabular-nums', className)}>
      {formatValue(displayValue)}
    </span>
  )
}

// Percentage variant
interface AnimatedPercentageProps {
  value: number
  duration?: number
  delay?: number
  className?: string
  decimals?: number
  showSign?: boolean
}

export function AnimatedPercentage({
  value,
  duration = 1000,
  delay = 0,
  className,
  decimals = 1,
  showSign = false,
}: AnimatedPercentageProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)
  const startTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            startAnimation()
          }
        })
      },
      { threshold: 0.1 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      observer.disconnect()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, hasAnimated])

  const startAnimation = () => {
    const startValue = 0
    const endValue = value

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp + delay
      }

      const elapsed = timestamp - startTimeRef.current

      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

      const currentValue = startValue + (endValue - startValue) * easeProgress
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  const sign = showSign && displayValue > 0 ? '+' : ''

  return (
    <span ref={elementRef} className={cn('animate-number font-mono tabular-nums', className)}>
      {sign}{displayValue.toFixed(decimals).replace('.', ',')}%
    </span>
  )
}
