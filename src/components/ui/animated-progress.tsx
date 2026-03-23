'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedProgressBarProps {
  value: number
  max?: number
  duration?: number
  delay?: number
  className?: string
  barClassName?: string
  height?: 'xs' | 'sm' | 'md' | 'lg'
  color?: 'default' | 'gradient' | 'teal' | 'accent' | 'amber' | 'red'
  showLabel?: boolean
  labelPosition?: 'inside' | 'outside'
}

export function AnimatedProgressBar({
  value,
  max = 100,
  duration = 1000,
  delay = 0,
  className,
  barClassName,
  height = 'md',
  color = 'gradient',
  showLabel = false,
  labelPosition = 'outside',
}: AnimatedProgressBarProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)

  const percentage = Math.min((value / max) * 100, 100)

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
  }, [percentage, hasAnimated])

  const startAnimation = () => {
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

      const currentValue = percentage * easeProgress
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(percentage)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  const heightClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  const colorClasses = {
    default: 'bg-[var(--text-2)]',
    gradient: 'bg-gradient-to-r from-[var(--accent-1)] to-teal',
    teal: 'bg-teal',
    'accent': 'bg-[var(--accent-1)]',
    amber: 'bg-amber',
    red: 'bg-red',
  }

  return (
    <div ref={elementRef} className={cn('w-full', className)}>
      {showLabel && labelPosition === 'outside' && (
        <div className="flex justify-between text-xs text-[var(--text-2)] mb-1.5">
          <span>Progresso</span>
          <span className="font-mono">{displayValue.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn(
        'w-full rounded-full overflow-hidden bg-[var(--border-1)]',
        heightClasses[height]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-none',
            colorClasses[color],
            barClassName
          )}
          style={{ width: `${displayValue}%` }}
        >
          {showLabel && labelPosition === 'inside' && height === 'lg' && (
            <span className="text-xs text-white font-medium px-2">
              {displayValue.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Segmented Progress for multiple values
interface AnimatedSegmentedProgressProps {
  segments: Array<{
    value: number
    color: string
    label?: string
  }>
  max?: number
  duration?: number
  delay?: number
  className?: string
  height?: 'sm' | 'md' | 'lg'
}

export function AnimatedSegmentedProgress({
  segments,
  max = 100,
  duration = 1000,
  delay = 0,
  className,
  height = 'md',
}: AnimatedSegmentedProgressProps) {
  const [displayValues, setDisplayValues] = useState(segments.map(() => 0))
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
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
  }, [segments, hasAnimated])

  const startAnimation = () => {
    const targetValues = segments.map((s) => Math.min((s.value / max) * 100, 100))

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

      const currentValues = targetValues.map((target) => target * easeProgress)
      setDisplayValues(currentValues)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValues(targetValues)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div ref={elementRef} className={cn('w-full', className)}>
      <div className={cn(
        'w-full rounded-full overflow-hidden bg-[var(--border-1)] flex',
        heightClasses[height]
      )}>
        {segments.map((segment, index) => (
          <div
            key={index}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${displayValues[index]}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>
      {segments.some((s) => s.label) && (
        <div className="flex gap-4 mt-2">
          {segments.map((segment, index) => (
            segment.label && (
              <div key={index} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-[var(--text-2)]">{segment.label}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}

// Circular Progress Ring with Animation
interface AnimatedProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  duration?: number
  delay?: number
  color?: 'teal' | 'accent' | 'amber' | 'red'
  className?: string
  children?: React.ReactNode
}

export function AnimatedProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  duration = 1000,
  delay = 0,
  color = 'teal',
  className,
  children,
}: AnimatedProgressRingProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)

  const percentage = Math.min((value / max) * 100, 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (displayValue / 100) * circumference

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
  }, [percentage, hasAnimated])

  const startAnimation = () => {
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

      const currentValue = percentage * easeProgress
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(percentage)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  const colorClasses = {
    teal: 'stroke-teal',
    'accent': 'stroke-[var(--accent-1)]',
    amber: 'stroke-amber',
    red: 'stroke-red',
  }

  return (
    <div ref={elementRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={colorClasses[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
