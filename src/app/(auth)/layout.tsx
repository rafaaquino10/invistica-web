'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/layout'

// Animated stock chart component
function AnimatedStockChart() {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 h-48 opacity-20"
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Animated fill area */}
      <path
        d="M0,80 Q50,70 80,60 T150,50 T220,35 T280,25 T350,15 L400,10 L400,100 L0,100 Z"
        fill="url(#chartGradient)"
        className="animate-auth-chart-fill"
      />

      {/* Animated line path */}
      <path
        d="M0,80 Q50,70 80,60 T150,50 T220,35 T280,25 T350,15 L400,10"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-auth-chart-line"
      />

      {/* Animated dot at the end */}
      <circle
        cx="400"
        cy="10"
        r="4"
        fill="white"
        className="animate-auth-pulse-glow"
      />
    </svg>
  )
}

// Floating orbs that move smoothly
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large orb - slow drift */}
      <div
        className="absolute w-96 h-96 rounded-full bg-white/5 blur-3xl animate-auth-float-slow"
        style={{ top: '10%', left: '-10%' }}
      />

      {/* Medium orb - medium speed */}
      <div
        className="absolute w-64 h-64 rounded-full bg-white/10 blur-2xl animate-auth-float-medium"
        style={{ top: '50%', right: '-5%' }}
      />

      {/* Small orb - faster movement */}
      <div
        className="absolute w-48 h-48 rounded-full bg-teal/20 blur-xl animate-auth-float-fast"
        style={{ bottom: '20%', left: '30%' }}
      />

      {/* Accent orb */}
      <div
        className="absolute w-32 h-32 rounded-full bg-white/15 blur-lg animate-auth-float-drift"
        style={{ top: '30%', right: '20%' }}
      />
    </div>
  )
}

// Subtle grid lines that pulse
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] animate-auth-grid-pulse" />
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--accent-1)] to-teal relative overflow-hidden">
        {/* Background layers - all pointer-events-none and behind content */}
        <AnimatedGrid />
        <FloatingOrbs />
        <AnimatedStockChart />

        {/* Content layer - above all decorative elements */}
        <div className="relative z-20 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="font-display font-bold text-lg">IQ</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              <span className="text-white">Invest</span>
              <span className="text-white">IQ</span>
            </span>
          </Link>

          <div className="max-w-lg">
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Inteligência que valoriza.
            </h1>
            <p className="text-white/80 text-lg">
              A plataforma de analytics de investimentos que unifica análise fundamentalista,
              portfólio analytics e gestão de carteira.
            </p>
          </div>

          <div className="flex items-center gap-12">
            <div className="group">
              <p className="text-4xl font-bold tracking-tight group-hover:scale-105 transition-transform">5,5M+</p>
              <p className="text-sm text-white/60">Investidores PF na B3</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="group">
              <p className="text-4xl font-bold tracking-tight group-hover:scale-105 transition-transform">947</p>
              <p className="text-sm text-white/60">Ativos analisados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative">
        {/* Subtle background gradient for right side */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--accent-1)]/5 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2 lg:hidden hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-1)] to-teal flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">IQ</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              <span className="text-[var(--accent-1)]">Invest</span>
              <span className="text-[var(--logo-text-color)]">IQ</span>
            </span>
          </Link>
          <div className="lg:ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
