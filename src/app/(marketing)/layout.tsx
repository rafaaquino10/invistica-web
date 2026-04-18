'use client'

import Link from 'next/link'

// Invística Wordmark — Fraunces serif, only used here in the logo
function InvisticaWordmark() {
  return (
    <span
      style={{
        fontFamily: 'Fraunces, Georgia, serif',
        fontWeight: 400,
        fontSize: '20px',
        letterSpacing: '-0.02em',
        color: '#FFFFFF',
      }}
    >
      Invística
    </span>
  )
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#070F1F' }}
    >
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="px-8 sm:px-12 lg:px-20">
          <div className="flex items-center justify-between h-20">
            {/* Logo — flush left */}
            <Link href="/" className="relative z-50">
              <InvisticaWordmark />
            </Link>

            {/* Single link — flush right */}
            <Link
              href="/login"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main>{children}</main>
    </div>
  )
}
