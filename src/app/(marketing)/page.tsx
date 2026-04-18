'use client'

import { useEffect, useRef, useState } from 'react'
import '@fontsource/fraunces/400.css'

// Brand colors
const COLORS = {
  bgDark: '#070F1F',
  bgPanel: '#0A1428',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.65)',
  accentYellow: '#FFE93D',
}

// Performance line data points (simulated cumulative return)
const generatePerformanceData = () => {
  const points: number[] = []
  let value = 0
  for (let i = 0; i < 120; i++) {
    // Slight upward drift with noise
    const change = (Math.random() - 0.45) * 2
    value += change
    points.push(value)
  }
  // Normalize to 0-100 range
  const min = Math.min(...points)
  const max = Math.max(...points)
  return points.map((p) => ((p - min) / (max - min)) * 60 + 20)
}

// Animated performance line component
function PerformanceLine() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [data] = useState(() => generatePerformanceData())
  const animationRef = useRef<number | null>(null)
  const progressRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }
    updateSize()

    const width = canvas.getBoundingClientRect().width
    const height = canvas.getBoundingClientRect().height

    const drawLine = (progress: number) => {
      ctx.clearRect(0, 0, width, height)

      // Draw the line
      ctx.beginPath()
      ctx.strokeStyle = COLORS.accentYellow
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const pointsToDraw = Math.floor((progress / 100) * data.length)

      for (let i = 0; i <= pointsToDraw && i < data.length; i++) {
        const x = (i / (data.length - 1)) * width
        const y = height - (data[i] / 100) * height

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()
    }

    // Trigger animation after a short delay
    const startAnimation = () => {
      setIsDrawing(true)
      const duration = 2500 // ms
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min((elapsed / duration) * 100, 100)
        progressRef.current = progress

        drawLine(progress)

        if (progress < 100) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    const timer = setTimeout(startAnimation, 800)

    return () => {
      clearTimeout(timer)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [data])

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: '80px' }}
    />
  )
}

// Key metrics displayed below the line
function KeyMetrics() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const metrics = [
    { value: '+127.4%', label: '3Y' },
    { value: '0.82', label: 'α' },
    { value: '14.2%', label: 'Vol' },
  ]

  return (
    <div
      className="flex justify-center gap-24 sm:gap-32 lg:gap-40 mt-12"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 1s ease',
      }}
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="text-center">
          <div
            className="font-mono text-sm sm:text-base tracking-wide"
            style={{ color: COLORS.textMuted }}
          >
            {metric.value}
          </div>
          <div
            className="text-[10px] uppercase tracking-[0.2em] mt-1"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function InvisticaLanding() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: COLORS.bgDark }}
    >
      {/* Hero Section — massive negative space */}
      <section className="flex-1 flex flex-col justify-center items-center px-8 pt-32 pb-24">
        {/* Performance visualization container */}
        <div className="w-full max-w-4xl">
          {/* The animated line */}
          <PerformanceLine />

          {/* Key metrics below */}
          <KeyMetrics />
        </div>
      </section>
    </div>
  )
}
