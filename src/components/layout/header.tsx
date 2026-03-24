'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { ThemeToggle } from './theme-toggle'
import { Logo } from '@/components/brand'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { free } from '@/lib/api/endpoints'
import { AssetLogo } from '@/components/ui/asset-logo'
import { RegimeBadge } from '@/components/ui/regime-badge'

// ─── Plan badge (shared with sidebar export) ──────────────
export function PlanBadge({ plan }: { plan: string }) {
  const label = plan === 'elite' ? 'Premium' : plan === 'pro' ? 'Pro' : 'Free'
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-medium bg-[var(--surface-2)] text-[var(--text-3)]">
      {label}
    </span>
  )
}

// ─── Font scale logic (inline, no separate component in header) ──
type FontScale = 'compact' | 'normal' | 'large'
const FONT_LABELS: Record<FontScale, string> = { compact: 'Menor', normal: 'Normal', large: 'Maior' }
const ZOOM_MAP: Record<FontScale, string> = { compact: '0.92', normal: '1', large: '1.08' }

function applyZoom(scale: FontScale) {
  document.documentElement.style.setProperty('--content-zoom', ZOOM_MAP[scale] ?? '1')
  document.documentElement.setAttribute('data-font-size', scale)
}

interface HeaderProps {
  isSidebarCollapsed: boolean
  user?: {
    name: string | null
    email: string | null
    image: string | null
    plan?: string
  } | null
}

export function Header({ isSidebarCollapsed, user }: HeaderProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const mobileSearchRef = useRef<HTMLInputElement>(null)

  // ─── Font scale state ───────────────────────────────
  const [fontScale, setFontScale] = useState<FontScale>('normal')
  useEffect(() => {
    const saved = localStorage.getItem('aqinvest-font-size') as FontScale | null
    if (saved && ZOOM_MAP[saved]) {
      setFontScale(saved)
      applyZoom(saved)
    }
  }, [])

  const cycleFontScale = () => {
    const order: FontScale[] = ['compact', 'normal', 'large']
    const idx = order.indexOf(fontScale)
    const next = order[(idx + 1) % order.length] as FontScale
    setFontScale(next)
    applyZoom(next)
    localStorage.setItem('aqinvest-font-size', next)
  }

  // ─── Search State ──────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 150)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (window.innerWidth < 768) {
          setIsMobileSearchOpen(true)
        } else {
          searchRef.current?.focus()
        }
      }
      if (e.key === 'Escape' && isMobileSearchOpen) {
        setIsMobileSearchOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobileSearchOpen])

  // Autofocus mobile search input when overlay opens
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileSearchRef.current?.focus(), 100)
    } else {
      setSearchQuery('')
      setSelectedIdx(-1)
    }
  }, [isMobileSearchOpen])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Search results via InvestIQ API
  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['ticker-search', debouncedQuery],
    queryFn: () => free.getTickers({ limit: 100 }),
    enabled: debouncedQuery.length >= 1,
    staleTime: 5 * 60 * 1000,
  })

  const searchResults = debouncedQuery.length >= 1
    ? (searchData?.tickers ?? [])
        .filter(t =>
          t.ticker.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          (t.company_name ?? '').toLowerCase().includes(debouncedQuery.toLowerCase())
        )
        .map(t => ({ ticker: t.ticker, name: t.company_name, logo: null as string | null, sector: null as string | null }))
        .slice(0, 8)
    : []

  const results = searchResults

  // Quick actions para command palette
  const quickActions = [
    { label: 'Explorer — Todas as ações', href: '/explorer' },
    { label: 'Comparar ativos', href: '/comparar' },
    { label: 'Meu portfólio', href: '/portfolio' },
    { label: 'Radar de alertas', href: '/radar' },
    { label: 'Carteiras inteligentes', href: '/carteiras' },
    { label: 'Dividendos', href: '/dividendos' },
    { label: 'Glossário financeiro', href: '/glossario' },
    { label: 'Configurações', href: '/configuracoes' },
  ]

  const filteredActions = debouncedQuery.length >= 1
    ? quickActions.filter(a => a.label.toLowerCase().includes(debouncedQuery.toLowerCase()))
    : quickActions

  const navigateToAction = useCallback((href: string) => {
    setSearchQuery('')
    setIsSearchOpen(false)
    setSelectedIdx(-1)
    router.push(href)
  }, [router])

  const navigateToAsset = useCallback((ticker: string) => {
    setSearchQuery('')
    setIsSearchOpen(false)
    setSelectedIdx(-1)
    router.push(`/ativo/${ticker}`)
  }, [router])

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selectedIdx >= 0 && results[selectedIdx]) {
      e.preventDefault()
      navigateToAsset(results[selectedIdx].ticker)
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false)
      searchRef.current?.blur()
    }
  }

  const userPlan = (user as any)?.plan ?? 'free'

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-14 z-30',
        'bg-[var(--surface-1)]/80 backdrop-blur-2xl',
        'border-b border-[var(--border-1)]',
        'transition-all duration-200',
        'flex items-center justify-between px-3 md:px-5',
        isSidebarCollapsed ? 'left-0 md:left-[64px]' : 'left-0 md:left-[200px]'
      )}
    >
      {/* Mobile Logo */}
      <div className="flex items-center md:hidden">
        <Link href="/dashboard">
          <Logo size="sm" animated />
        </Link>
      </div>

      {/* ─── Search (wider, left-aligned) ────────────── */}
      <div
        ref={dropdownRef}
        className={cn(
          'hidden md:flex items-center flex-1 relative',
          'transition-all duration-200',
          isSearchOpen ? 'max-w-lg' : 'max-w-md'
        )}
      >
        <div className="relative w-full">
          {/* Search Icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Input */}
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setIsSearchOpen(true); setSelectedIdx(-1) }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar ativo..."
            className={cn(
              'w-full h-9 pl-9 pr-16 rounded-[var(--radius)] text-[var(--text-body)]',
              'bg-[var(--surface-2)]/50 border border-[var(--border-1)]',
              'text-[var(--text-1)] placeholder:text-[var(--text-3)]',
              'transition-all duration-150',
              'focus:border-[var(--accent-1)]/40 focus:ring-1 focus:ring-[var(--accent-1)]/20 focus:outline-none',
              'focus:bg-[var(--surface-2)]'
            )}
          />

          {/* Ctrl+K chip */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="text-[10px] font-mono text-[var(--text-3)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded-[var(--radius-xs)] border border-[var(--border-1)]">
              {typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent ?? '') ? '⌘' : 'Ctrl'}
            </kbd>
            <kbd className="text-[10px] font-mono text-[var(--text-3)] bg-[var(--surface-2)] px-1 py-0.5 rounded-[var(--radius-xs)] border border-[var(--border-1)]">
              K
            </kbd>
          </div>

          {/* ─── Results Dropdown ───────────────────────── */}
          {isSearchOpen && debouncedQuery.length >= 1 && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-[var(--shadow-overlay)] overflow-hidden z-50">
              {results.map((r, idx) => (
                <button
                  key={r.ticker}
                  onClick={() => navigateToAsset(r.ticker)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    idx === selectedIdx
                      ? 'bg-[var(--accent-2)]'
                      : 'hover:bg-[var(--surface-2)]'
                  )}
                >
                  <AssetLogo ticker={r.ticker} logo={r.logo} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-small)] font-semibold text-[var(--text-1)]">{r.ticker}</span>
                      <span className="text-[var(--text-caption)] text-[var(--text-2)] truncate">{r.name}</span>
                    </div>
                  </div>
                  {r.sector && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-2)] text-[var(--text-3)] flex-shrink-0">
                      {r.sector}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {isSearchOpen && debouncedQuery.length >= 1 && isSearchLoading && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-[var(--shadow-overlay)] p-3 z-50">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-3 h-3 rounded-full border-2 border-[var(--accent-1)]/30 border-t-[var(--accent-1)] animate-spin" />
                <p className="text-[var(--text-small)] text-[var(--text-2)]">Buscando...</p>
              </div>
            </div>
          )}

          {/* No results + quick actions fallback */}
          {isSearchOpen && debouncedQuery.length >= 1 && results.length === 0 && searchResults !== undefined && !isSearchLoading && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-[var(--shadow-overlay)] overflow-hidden z-50">
              {filteredActions.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-3)]">Ações rápidas</div>
                  {filteredActions.slice(0, 5).map(action => (
                    <button
                      key={action.href}
                      onClick={() => navigateToAction(action.href)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <span className="w-1 h-1 rounded-full bg-[var(--accent-1)] shrink-0" />
                      <span className="text-[var(--text-small)] text-[var(--text-1)]">{action.label}</span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-4">
                  <p className="text-[var(--text-small)] text-[var(--text-2)] text-center">Nenhum resultado encontrado</p>
                </div>
              )}
            </div>
          )}

          {/* Quick actions quando focado sem query */}
          {isSearchOpen && debouncedQuery.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-[var(--shadow-overlay)] overflow-hidden z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-3)]">Ações rápidas</div>
              {quickActions.map(action => (
                <button
                  key={action.href}
                  onClick={() => navigateToAction(action.href)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--surface-2)] transition-colors"
                >
                  <span className="w-1 h-1 rounded-full bg-[var(--accent-1)] shrink-0" />
                  <span className="text-[var(--text-small)] text-[var(--text-1)]">{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Actions (regime badge + theme toggle + user) ── */}
      <div className="flex items-center gap-1.5">
        {/* Macro Regime Badge */}
        <RegimeBadge />
        {/* Mobile Search Button */}
        <button
          className="md:hidden p-3 rounded-[var(--radius-sm)] hover:bg-[var(--surface-2)] text-[var(--text-2)]"
          aria-label="Buscar"
          onClick={() => setIsMobileSearchOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-2)] transition-colors"
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? 'Avatar'}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent-2)] text-[var(--accent-1)] flex items-center justify-center text-[10px] font-bold">
                  {user.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U'}
                </div>
              )}
              <span className="hidden lg:block text-[var(--text-small)] font-medium text-[var(--text-1)] max-w-[100px] truncate">
                {user.name}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="hidden lg:block text-[var(--text-3)]">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-[var(--shadow-overlay)] py-1 z-50">
                  {/* User info + plan badge */}
                  <div className="px-4 py-2.5 border-b border-[var(--border-1)]">
                    <div className="flex items-center justify-between">
                      <p className="text-[var(--text-small)] font-medium text-[var(--text-1)]">
                        {user.name}
                      </p>
                      <PlanBadge plan={userPlan} />
                    </div>
                    <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  {/* Font size control */}
                  <button
                    onClick={cycleFontScale}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[var(--text-small)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 7 4 4 20 4 20 7" />
                      <line x1="9" y1="20" x2="15" y2="20" />
                      <line x1="12" y1="4" x2="12" y2="20" />
                    </svg>
                    Fonte: {FONT_LABELS[fontScale]}
                  </button>

                  {/* Settings */}
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-[var(--text-small)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Configurações
                  </Link>

                  {/* Divider before destructive action */}
                  <div className="my-1 border-t border-[var(--border-1)]" />

                  {/* Logout */}
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-[var(--text-small)] text-[var(--neg)] hover:bg-[var(--neg)]/5 transition-colors"
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      logout()
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="btn-primary h-9 px-4 text-sm"
          >
            Entrar
          </Link>
        )}
      </div>

      {/* ─── Mobile Search Overlay (full-screen) ────────── */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--bg)]/95 backdrop-blur-xl"
            onClick={() => setIsMobileSearchOpen(false)}
          />

          {/* Search Panel */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative flex flex-col h-full"
          >
            {/* Search Header */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--border-1)]">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  ref={mobileSearchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setIsSearchOpen(true); setSelectedIdx(-1) }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Buscar ativo ou acao..."
                  className={cn(
                    'w-full h-12 pl-10 pr-4 rounded-[var(--radius)] text-base',
                    'bg-[var(--surface-2)] border border-[var(--border-1)]',
                    'text-[var(--text-1)] placeholder:text-[var(--text-3)]',
                    'focus:border-[var(--accent-1)]/40 focus:ring-1 focus:ring-[var(--accent-1)]/20 focus:outline-none'
                  )}
                />
              </div>
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-3 rounded-[var(--radius-sm)] hover:bg-[var(--surface-2)] text-[var(--text-2)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading */}
              {debouncedQuery.length >= 1 && isSearchLoading && (
                <div className="flex items-center gap-2 justify-center py-8">
                  <div className="w-4 h-4 rounded-full border-2 border-[var(--accent-1)]/30 border-t-[var(--accent-1)] animate-spin" />
                  <p className="text-sm text-[var(--text-2)]">Buscando...</p>
                </div>
              )}

              {/* Asset Results */}
              {debouncedQuery.length >= 1 && results.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-3)]">Ativos</div>
                  {results.map((r, idx) => (
                    <button
                      key={r.ticker}
                      onClick={() => { navigateToAsset(r.ticker); setIsMobileSearchOpen(false) }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                        idx === selectedIdx ? 'bg-[var(--accent-2)]' : 'active:bg-[var(--surface-2)]'
                      )}
                    >
                      <AssetLogo ticker={r.ticker} logo={r.logo} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--text-1)]">{r.ticker}</span>
                          {r.sector && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-2)] text-[var(--text-3)]">
                              {r.sector}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--text-2)] truncate block">{r.name}</span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-3)] shrink-0">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {debouncedQuery.length >= 1 && results.length === 0 && searchResults !== undefined && !isSearchLoading && filteredActions.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--text-2)]">Nenhum resultado encontrado</p>
                </div>
              )}

              {/* Quick Actions */}
              {(debouncedQuery.length === 0 || (results.length === 0 && filteredActions.length > 0)) && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-3)]">
                    {debouncedQuery.length >= 1 ? 'Acoes rapidas' : 'Navegar para'}
                  </div>
                  {(debouncedQuery.length >= 1 ? filteredActions.slice(0, 5) : quickActions).map(action => (
                    <button
                      key={action.href}
                      onClick={() => { navigateToAction(action.href); setIsMobileSearchOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[var(--surface-2)] transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-1)] shrink-0" />
                      <span className="text-sm text-[var(--text-1)]">{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </header>
  )
}
