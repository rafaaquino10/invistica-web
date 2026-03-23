'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export interface SparklineProps {
  data: number[]
  height?: number
  width?: number
  strokeWidth?: number
  color?: 'auto' | 'blue' | 'teal' | 'amber' | 'red'
  fill?: boolean
  className?: string
}

const colorMap = {
  blue: 'var(--accent-1)',
  teal: 'var(--pos)',
  amber: 'var(--warn)',
  red: 'var(--neg)',
}

export function Sparkline({
  data,
  height = 24,
  width = 80,
  strokeWidth = 2,
  color = 'auto',
  fill = false,
  className,
}: SparklineProps) {
  const { path, fillPath, strokeColor, endY } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: '', fillPath: '', strokeColor: colorMap.blue, endY: height / 2 }
    }

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    // Normalize data points
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * (height - strokeWidth * 2) - strokeWidth
      return { x, y }
    })

    const firstPoint = points[0]
    if (!firstPoint) {
      return { path: '', fillPath: '', strokeColor: colorMap.blue, endY: height / 2 }
    }

    // Create smooth path using quadratic bezier curves
    let pathD = `M ${firstPoint.x} ${firstPoint.y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      if (prev && curr) {
        const midX = (prev.x + curr.x) / 2
        pathD += ` Q ${prev.x} ${prev.y} ${midX} ${(prev.y + curr.y) / 2}`
      }
    }
    const lastPoint = points[points.length - 1]
    if (lastPoint) {
      pathD += ` L ${lastPoint.x} ${lastPoint.y}`
    }

    // Fill path
    const fillD = `${pathD} L ${width} ${height} L 0 ${height} Z`

    // Auto color based on trend
    const firstValue = data[0] ?? 0
    const lastValue = data[data.length - 1] ?? 0
    let calculatedColor: string
    if (color === 'auto') {
      const trend = lastValue - firstValue
      calculatedColor = trend >= 0 ? colorMap.teal : colorMap.red
    } else {
      calculatedColor = colorMap[color]
    }

    // Calculate end Y position
    const endYPos = height - ((lastValue - min) / range) * (height - strokeWidth * 2) - strokeWidth

    return { path: pathD, fillPath: fillD, strokeColor: calculatedColor, endY: endYPos }
  }, [data, height, width, strokeWidth, color])

  if (!data || data.length < 2) {
    return null
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
    >
      {fill && (
        <path
          d={fillPath}
          fill={strokeColor}
          fillOpacity={0.1}
          className="transition-all duration-500"
        />
      )}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-500"
      />
      {/* End dot */}
      <circle
        cx={width}
        cy={endY}
        r={strokeWidth + 1}
        fill={strokeColor}
        className="transition-all duration-500"
      />
    </svg>
  )
}
