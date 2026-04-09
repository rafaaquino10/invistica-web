'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const primaryNav = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
  },
  {
    label: 'Explorer',
    href: '/explorer',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'Portfólio',
    href: '/portfolio',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Radar',
    href: '/radar',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 12l8-8" />
        <path d="M12 2v10" />
      </svg>
    ),
  },
]

const moreMenuItems = [
  {
    label: 'Mapa',
    href: '/mapa',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Dividendos',
    href: '/dividends',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: 'Estratégias',
    href: '/estrategias',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /><line x1="9" y1="21" x2="15" y2="21" /><line x1="10" y1="24" x2="14" y2="24" />
      </svg>
    ),
  },
  {
    label: 'Comparar',
    href: '/comparar',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Ajustes',
    href: '/settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const isMoreActive = moreMenuItems.some(item => pathname.startsWith(item.href))

  return (
    <>
      {/* "Mais" overlay menu */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setIsMoreOpen(false)}
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 md:hidden"
            >
              <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-1)]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-3)]">Navegação</p>
                </div>
                <div className="grid grid-cols-3 gap-1 p-3">
                  {moreMenuItems.map((item) => {
                    const active = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href as any}
                        onClick={() => setIsMoreOpen(false)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-colors',
                          active
                            ? 'bg-[var(--accent-2)] text-[var(--accent-1)]'
                            : 'text-[var(--text-2)] active:bg-[var(--surface-2)]'
                        )}
                      >
                        <span className="leading-none">{item.icon}</span>
                        <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom navigation bar */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:hidden',
          'bg-[var(--surface-1)]/90 backdrop-blur-xl',
          'border-t border-[var(--border-1)]',
          'pb-[env(safe-area-inset-bottom)]'
        )}
      >
        <div className="flex items-center justify-around h-16">
          {primaryNav.map((item) => {
            const isActive = pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={cn(
                  'relative flex flex-col items-center justify-center',
                  'w-full h-full',
                  'transition-colors duration-200',
                  isActive
                    ? 'text-[var(--accent-1)]'
                    : 'text-[var(--text-2)]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 w-12 h-1 bg-[var(--accent-1)] rounded-b-full"
                    transition={{ duration: 0.2 }}
                  />
                )}
                <motion.span
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {item.icon}
                </motion.span>
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </Link>
            )
          })}

          {/* "Mais" button */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={cn(
              'relative flex flex-col items-center justify-center',
              'w-full h-full',
              'transition-colors duration-200',
              (isMoreOpen || isMoreActive)
                ? 'text-[var(--accent-1)]'
                : 'text-[var(--text-2)]'
            )}
          >
            {isMoreActive && !isMoreOpen && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute top-0 w-12 h-1 bg-[var(--accent-1)] rounded-b-full"
                transition={{ duration: 0.2 }}
              />
            )}
            <motion.span
              animate={{ scale: isMoreOpen ? 1.1 : 1, rotate: isMoreOpen ? 45 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </motion.span>
            <span className="text-[10px] font-medium mt-1">Mais</span>
          </button>
        </div>
      </nav>
    </>
  )
}
