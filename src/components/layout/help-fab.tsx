'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

type HelpItem =
  | { label: string; href: string; action?: never; icon: React.ReactNode }
  | { label: string; action: 'tour'; href?: never; icon: React.ReactNode }

const helpItems: HelpItem[] = [
  {
    label: 'Refazer Tour',
    action: 'tour' as const,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    label: 'Contatar suporte',
    href: 'mailto:suporte@investiq.com.br',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
]

export function HelpFab() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={menuRef} className="fixed bottom-4 right-4 z-40">
      {/* Menu */}
      <div
        className={cn(
          'absolute bottom-16 right-0 w-64 rounded-[var(--radius)] overflow-hidden transition-all duration-200',
          'bg-[var(--surface-1)] border border-[var(--border-1)] shadow-[var(--shadow-overlay)]',
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-2 pointer-events-none'
        )}
      >
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">
            Ajuda
          </p>
        </div>

        <div className="px-2 pb-2">
          {helpItems.map((item) => {
            const content = (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]">
                <span className="flex-shrink-0 opacity-60">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
            )

            if (item.href) {
              return (
                <a key={item.label} href={item.href} onClick={() => setIsOpen(false)}>
                  {content}
                </a>
              )
            }

            if (item.action === 'tour') {
              return (
                <button
                  key={item.label}
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    localStorage.removeItem('aqinvest-onboarding-completed')
                    window.location.reload()
                  }}
                >
                  {content}
                </button>
              )
            }

            return null
          })}
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
          'bg-[var(--surface-1)]/70 border border-[var(--border-1)]/50 backdrop-blur-sm',
          'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-1)]',
          isOpen && 'border-[var(--accent-1)]/30'
        )}
        aria-label="Ajuda"
      >
        <span
          className="text-sm font-bold"
          style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          ?
        </span>
      </button>
    </div>
  )
}
