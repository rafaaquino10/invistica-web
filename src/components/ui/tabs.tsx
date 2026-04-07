'use client'

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
  badge?: string | number
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  defaultTab?: string
  /** Se fornecido, sincroniza aba ativa via ?{urlParam}=id na URL */
  urlParam?: string
  variant?: 'pills' | 'underline'
  size?: 'sm' | 'md'
  className?: string
  children?: ReactNode
  onChange?: (id: string) => void
}

interface TabsContextValue {
  activeTab: string
  setActiveTab: (id: string) => void
  instanceId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabPanel deve estar dentro de Tabs')
  return ctx
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export function Tabs({
  tabs,
  defaultTab,
  urlParam,
  variant = 'pills',
  size = 'md',
  className,
  children,
  onChange,
}: TabsProps) {
  const instanceId = useId()
  const router = useRouter()
  const searchParams = useSearchParams()

  const resolveInitial = (): string => {
    if (urlParam) {
      const fromUrl = searchParams.get(urlParam)
      if (fromUrl && tabs.some((t) => t.id === fromUrl && !t.disabled)) return fromUrl
    }
    if (defaultTab && tabs.some((t) => t.id === defaultTab && !t.disabled)) return defaultTab
    return tabs.find((t) => !t.disabled)?.id ?? tabs[0]?.id ?? ''
  }

  const [activeTab, setActiveTabState] = useState<string>(resolveInitial)

  // Sync URL → state when searchParams change externally
  useEffect(() => {
    if (!urlParam) return
    const fromUrl = searchParams.get(urlParam)
    if (fromUrl && fromUrl !== activeTab && tabs.some((t) => t.id === fromUrl && !t.disabled)) {
      setActiveTabState(fromUrl)
    }
  }, [searchParams, urlParam]) // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveTab = (id: string) => {
    setActiveTabState(id)
    onChange?.(id)
    if (urlParam) {
      const params = new URLSearchParams(searchParams.toString())
      params.set(urlParam, id)
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const enabledIds = tabs.filter((t) => !t.disabled).map((t) => t.id)

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = enabledIds.indexOf(activeTab)
    let next: string | undefined

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        next = enabledIds[(idx + 1) % enabledIds.length]
        break
      case 'ArrowLeft':
        e.preventDefault()
        next = enabledIds[(idx - 1 + enabledIds.length) % enabledIds.length]
        break
      case 'Home':
        e.preventDefault()
        next = enabledIds[0]
        break
      case 'End':
        e.preventDefault()
        next = enabledIds[enabledIds.length - 1]
        break
      default:
        return
    }

    if (next) {
      setActiveTab(next)
      tabRefs.current[next]?.focus()
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const listClass = cn(
    'flex gap-1',
    variant === 'pills' && 'p-1 bg-[var(--surface-2)] rounded-[var(--radius)] w-fit overflow-x-auto',
    variant === 'underline' && 'border-b border-[var(--border-1)] overflow-x-auto',
    className
  )

  const tabClass = (tab: TabItem) => {
    const base = cn(
      'inline-flex items-center gap-2 font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-1)]',
      size === 'md' ? 'px-4 py-2 text-sm rounded-lg' : 'px-3 py-1.5 text-xs rounded-md',
      tab.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
    )

    if (variant === 'pills') {
      return cn(
        base,
        activeTab === tab.id
          ? 'bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm'
          : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
      )
    }

    // underline
    return cn(
      base,
      'rounded-none border-b-2 -mb-px',
      activeTab === tab.id
        ? 'border-[var(--accent-1)] text-[var(--text-1)]'
        : 'border-transparent text-[var(--text-2)] hover:text-[var(--text-1)] hover:border-[var(--border-1)]'
    )
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, instanceId }}>
      <div>
        {/* Tablist */}
        <div
          role="tablist"
          aria-label="Navegação por abas"
          className={listClass}
          onKeyDown={handleKeyDown}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[tab.id] = el }}
              role="tab"
              id={`${instanceId}-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`${instanceId}-panel-${tab.id}`}
              aria-disabled={tab.disabled}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              className={tabClass(tab)}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 rounded-full text-xs font-mono leading-none',
                  activeTab === tab.id
                    ? 'bg-[var(--accent-1)] text-white'
                    : 'bg-[var(--border-1)] text-[var(--text-2)]'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {children}
      </div>
    </TabsContext.Provider>
  )
}

// ─── TabPanel ─────────────────────────────────────────────────────────────────

export interface TabPanelProps {
  id: string
  children: ReactNode
  className?: string
  /** Mantém o conteúdo montado mesmo quando inativo (default: false) */
  keepMounted?: boolean
}

export function TabPanel({ id, children, className, keepMounted = false }: TabPanelProps) {
  const { activeTab, instanceId } = useTabsContext()
  const isActive = activeTab === id

  if (!isActive && !keepMounted) return null

  return (
    <div
      role="tabpanel"
      id={`${instanceId}-panel-${id}`}
      aria-labelledby={`${instanceId}-tab-${id}`}
      hidden={!isActive}
      className={cn('animate-fade-in', !isActive && 'hidden', className)}
    >
      {children}
    </div>
  )
}
