'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Sidebar, Header, BottomNav, HelpFab, TickerTape } from '@/components/layout'
import { OnboardingTour } from '@/components/onboarding'
import { Disclaimer } from '@/components/ui'
import { DataStatusBanner } from '@/components/ui/data-status-banner'
import { cn } from '@/lib/utils'
import { Toaster } from 'sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user: authUser } = useAuth()
  const router = useRouter()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Atalhos de teclado globais
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignorar se foco está em input/textarea
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    // Ignorar com Ctrl/Meta (Ctrl+K já tratado no header)
    if (e.ctrlKey || e.metaKey) return

    switch (e.key) {
      case 'g':
        if (e.shiftKey) { e.preventDefault(); router.push('/') } // Shift+G → Dashboard
        break
      case 'e':
        e.preventDefault(); router.push('/explorer')
        break
      case 'c':
        e.preventDefault(); router.push('/comparar')
        break
      case 'p':
        e.preventDefault(); router.push('/portfolio')
        break
      case '?':
        e.preventDefault()
        // Mostra dica de atalhos brevemente
        const existing = document.getElementById('keyboard-hints')
        if (existing) { existing.remove(); return }
        const div = document.createElement('div')
        div.id = 'keyboard-hints'
        div.className = 'fixed bottom-20 md:bottom-6 right-6 z-50 bg-[var(--surface-1)] border border-[var(--border-1)]/30 rounded-xl p-4 shadow-xl text-xs space-y-1 animate-in fade-in'
        div.innerHTML = `
          <div class="font-semibold text-[var(--text-1)] mb-2">Atalhos de Teclado</div>
          <div class="text-[var(--text-2)]"><kbd class="px-1.5 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--border-1)]/20 font-mono text-[10px]">e</kbd> Explorer</div>
          <div class="text-[var(--text-2)]"><kbd class="px-1.5 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--border-1)]/20 font-mono text-[10px]">c</kbd> Comparar</div>
          <div class="text-[var(--text-2)]"><kbd class="px-1.5 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--border-1)]/20 font-mono text-[10px]">p</kbd> Portfólio</div>
          <div class="text-[var(--text-2)]"><kbd class="px-1.5 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--border-1)]/20 font-mono text-[10px]">Shift+G</kbd> Dashboard</div>
          <div class="text-[var(--text-2)]"><kbd class="px-1.5 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--border-1)]/20 font-mono text-[10px]">j</kbd>/<kbd class="px-1.5 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--border-1)]/20 font-mono text-[10px]">k</kbd> Navegar lista (Explorer)</div>
          <div class="text-[var(--text-2)]"><kbd class="px-1.5 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--border-1)]/20 font-mono text-[10px]">Enter</kbd> Abrir ativo selecionado</div>
          <div class="text-[var(--text-2)]"><kbd class="px-1.5 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--border-1)]/20 font-mono text-[10px]">Ctrl+K</kbd> Buscar</div>
          <div class="text-[var(--text-2)]"><kbd class="px-1.5 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--border-1)]/20 font-mono text-[10px]">?</kbd> Esta ajuda</div>
        `
        document.body.appendChild(div)
        setTimeout(() => div.remove(), 5000)
        break
    }
  }, [router])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    setIsMounted(true)
    // Check for saved preference
    const saved = localStorage.getItem('investiq-sidebar-collapsed')
    if (saved) {
      setIsSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    localStorage.setItem('investiq-sidebar-collapsed', JSON.stringify(newState))
  }

  const user = authUser
    ? { name: authUser.name ?? null, email: authUser.email ?? null, image: authUser.image ?? null, plan: (authUser as any).plan ?? 'free' }
    : { name: 'Rafael Demo', email: 'demo@invistica.com.br', image: null, plan: 'elite' }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="flex items-center justify-center h-screen">
          <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--accent-1)] flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-[var(--text-subheading)]">aQ</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Link de acessibilidade: pula direto para o conteúdo principal */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[var(--accent-1)] focus:text-white focus:rounded-lg focus:text-[var(--text-small)] focus:font-medium"
      >
        Pular para o conteúdo
      </a>

      {/* Sidebar (Desktop) */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      {/* Header */}
      <Header isSidebarCollapsed={isSidebarCollapsed} user={user} />

      {/* Ticker Tape */}
      <div
        className={cn(
          'fixed top-14 right-0 z-20 transition-all duration-200',
          isSidebarCollapsed ? 'left-0 md:left-[64px]' : 'left-0 md:left-[200px]'
        )}
      >
        <TickerTape />
      </div>

      {/* Main Content */}
      <main
        id="main-content"
        className={cn(
          'transition-all duration-200',
          'pt-[88px] pb-20 md:pb-0',
          'px-3 md:px-5 lg:px-6',
          'min-h-screen',
          isSidebarCollapsed ? 'md:ml-[64px]' : 'md:ml-[200px]'
        )}
        style={{ zoom: 'var(--content-zoom, 1)' }}
      >
        <div className="py-5">
          <DataStatusBanner />
          <Disclaimer variant="banner" />
          {children}
          <Disclaimer variant="footer" className="mt-6" />
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <BottomNav />

      {/* Help FAB */}
      <HelpFab />

      {/* Onboarding Tour (first visit only) */}
      <OnboardingTour />

      {/* Toast notifications */}
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}
