'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '@/components/layout'
import { Logo } from '@/components/brand'
import { cn } from '@/lib/utils'
import { Disclaimer } from '@/components/ui'

const navLinks = [
  { label: 'Recursos', href: '#features' },
  { label: 'IQ-Cognit™', href: '#aq-score' },
  { label: 'Planos', href: '/pricing' },
]

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
          isScrolled
            ? 'bg-[var(--surface-1)]/90 backdrop-blur-xl border-b border-[var(--border-1)]'
            : 'bg-transparent'
        )}
      >
        <div className="px-6 sm:px-10 lg:px-16">
          <div className="flex items-center h-[72px]">
            {/* Logo — flush left */}
            <Link href="/" className="relative z-50 flex-shrink-0">
              <Logo size="sm" animated />
            </Link>

            {/* Desktop Nav — after logo with generous spacing */}
            <nav className="hidden lg:flex items-center gap-8 ml-10">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href as any}
                  className="text-[var(--text-body)] font-medium transition-colors duration-150 text-[var(--text-2)] hover:text-[var(--text-1)]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions — flush right */}
            <div className="flex items-center gap-4 ml-auto">
              <ThemeToggle />

              <Link
                href="/login"
                className="hidden md:block text-[var(--text-body)] font-medium text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
              >
                Entrar
              </Link>

              <Link href="/register" className="hidden sm:block">
                <span className="inline-flex items-center h-9 px-4 text-[var(--text-body)] font-medium rounded-[var(--radius)] border border-[var(--border-2)] text-[var(--text-1)] hover:border-[var(--accent-1)] hover:text-[var(--accent-1)] transition-colors">
                  Criar conta
                </span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-2)] text-[var(--text-2)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isMobileMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="4" y1="8" x2="20" y2="8" />
                      <line x1="4" y1="16" x2="20" y2="16" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-[var(--border-1)] bg-[var(--surface-1)]"
            >
              <nav className="px-6 sm:px-10 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href as any}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-[var(--text-body)] font-medium rounded-[var(--radius-sm)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-[var(--border-1)] space-y-2">
                  <Link
                    href="/login"
                    className="block w-full px-4 py-3 text-center text-[var(--text-body)] font-medium rounded-[var(--radius-sm)] border border-[var(--border-1)] hover:bg-[var(--surface-2)]"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full px-4 py-3 text-center text-[var(--text-body)] font-medium rounded-[var(--radius-sm)] border border-[var(--border-2)] hover:border-[var(--accent-1)] hover:text-[var(--accent-1)] transition-colors"
                  >
                    Criar conta
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main */}
      <main className="pt-[72px]">
        {children}
      </main>

      {/* Footer — compact */}
      <footer className="border-t border-[var(--border-1)] mt-20">
        <div className="px-6 sm:px-10 lg:px-16 py-6">
          {/* Single row: brand + links inline */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-12">
            {/* Brand */}
            <Link href="/" className="shrink-0">
              <Logo size="sm" />
            </Link>

            {/* Links — inline groups */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[var(--text-small)] text-[var(--text-3)]">
              <Link href="/explorer" className="hover:text-[var(--text-1)] transition-colors">Explorer</Link>
              <Link href="/portfolio" className="hover:text-[var(--text-1)] transition-colors">Portfólio</Link>
              <Link href="/comparar" className="hover:text-[var(--text-1)] transition-colors">Comparar</Link>
              <Link href="/radar" className="hover:text-[var(--text-1)] transition-colors">Radar</Link>
              <Link href="/pricing" className="hover:text-[var(--text-1)] transition-colors">Planos</Link>
              <Link href="/termos" className="hover:text-[var(--text-1)] transition-colors">Termos</Link>
              <Link href="/privacidade" className="hover:text-[var(--text-1)] transition-colors">Privacidade</Link>
            </div>

            {/* Right — copyright */}
            <div className="lg:ml-auto text-[var(--text-caption)] text-[var(--text-3)] flex flex-col sm:flex-row gap-1 sm:gap-3">
              <span>© 2026 InvestIQ</span>
              <span className="hidden sm:inline">·</span>
              <Disclaimer variant="inline" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
