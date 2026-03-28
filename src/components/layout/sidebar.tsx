'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AQSymbol, AQWordmark } from '@/components/brand'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
}

type NavSection = {
  label: string
  items: NavItem[]
}

/* ─── Task-driven navigation (V2) ─────────────── */
const navigationSections: NavSection[] = [
  {
    label: 'PRINCIPAL',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
        ),
      },
      {
        label: 'Explorar',
        href: '/explorer',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        ),
      },
      {
        label: 'Carteira',
        href: '/portfolio',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        ),
      },
      {
        label: 'Dividendos',
        href: '/dividends',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'FERRAMENTAS',
    items: [
      {
        label: 'Comparar',
        href: '/comparar',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
      {
        label: 'Alertas',
        href: '/radar',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
      },
      {
        label: 'Notícias',
        href: '/news',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
          </svg>
        ),
      },
      {
        label: 'Glossário',
        href: '/glossario',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ),
      },
    ],
  },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40',
        'bg-[var(--surface-1)] border-r border-[var(--border-1)]',
        'transition-all duration-200',
        'hidden md:flex md:flex-col',
        isCollapsed ? 'w-[64px]' : 'w-[200px]'
      )}
    >
      {/* ─── Brand ─────────────────────────────────── */}
      <div className={cn(
        'flex-shrink-0 h-14 border-b border-[var(--border-1)] flex items-center',
        isCollapsed ? 'justify-center px-3' : 'px-4'
      )}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <AQSymbol size={isCollapsed ? 32 : 36} animated />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <AQWordmark fontSize={20} withSymbol />
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* ─── Navigation ───────────────────────────── */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navigationSections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {/* Section label */}
            {!isCollapsed && (
              <div className={cn(
                'px-4 pt-4 pb-1',
                sectionIdx === 0 && 'pt-1'
              )}>
                <span className="text-[var(--text-caption)] font-semibold uppercase tracking-[0.06em] text-[var(--text-3)]">
                  {section.label}
                </span>
              </div>
            )}
            {isCollapsed && sectionIdx > 0 && (
              <div className="mx-3 my-2">
                <div className="border-t border-[var(--border-1)]" />
              </div>
            )}

            <ul className="space-y-px px-2">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const isHovered = hoveredItem === item.href

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href as any}
                      aria-current={isActive ? 'page' : undefined}
                      onMouseEnter={() => setHoveredItem(item.href)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        'relative flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)]',
                        'transition-colors duration-100',
                        isActive
                          ? 'text-[var(--accent-1)] font-semibold'
                          : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]',
                        isCollapsed && 'justify-center px-0'
                      )}
                    >
                      {/* Active indicator — thin accent line */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActive"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[var(--accent-1)] rounded-r-full"
                          transition={{ duration: 0.15 }}
                        />
                      )}

                      <span className="flex-shrink-0">{item.icon}</span>

                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.1 }}
                            className={cn('text-[var(--text-body)]', isActive ? 'font-semibold' : 'font-normal')}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && isHovered && (
                        <div
                          className={cn(
                            'absolute left-full ml-3 px-3 py-1.5 rounded-[var(--radius)] z-50',
                            'bg-[var(--text-1)] text-[var(--bg)]',
                            'text-[var(--text-small)] font-medium whitespace-nowrap',
                            'shadow-[var(--shadow-overlay)]'
                          )}
                        >
                          {item.label}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45 bg-[var(--text-1)]" />
                        </div>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ─── Footer ───────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-[var(--border-1)] p-2 space-y-0.5">
        <Link
          href={'/settings' as any}
          aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)]',
            'transition-colors duration-100',
            pathname.startsWith('/settings')
              ? 'text-[var(--accent-1)] font-semibold'
              : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]',
            isCollapsed && 'justify-center px-0'
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.1 }}
                className="text-[var(--text-body)]"
              >
                Ajustes
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center justify-center p-2 rounded-[var(--radius-sm)]',
            'text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--surface-2)]',
            'transition-colors duration-100'
          )}
          aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <polyline points="15 18 9 12 15 6" />
          </motion.svg>
        </button>
      </div>
    </aside>
  )
}
