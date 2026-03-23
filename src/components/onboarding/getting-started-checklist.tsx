'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'aqinvest-checklist'

interface ChecklistItem {
  id: string
  label: string
  href?: string
}

const ITEMS: ChecklistItem[] = [
  { id: 'account', label: 'Criar conta' },
  { id: 'explore', label: 'Explorar o ranking de ações', href: '/explorer' },
  { id: 'analyze', label: 'Analisar um ativo em detalhe', href: '/ativo/PETR4' },
  { id: 'portfolio', label: 'Adicionar ação ao portfólio', href: '/portfolio' },
  { id: 'alert', label: 'Configurar primeiro alerta', href: '/radar' },
]

function getCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set(['account']) // conta criada por padrão
    return new Set(JSON.parse(raw))
  } catch {
    return new Set(['account'])
  }
}

function saveCompleted(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export function GettingStartedChecklist() {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCompleted(getCompleted())
    setDismissed(localStorage.getItem(`${STORAGE_KEY}-dismissed`) === 'true')
  }, [])

  const toggle = useCallback((id: string) => {
    setCompleted(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveCompleted(next)
      return next
    })
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    localStorage.setItem(`${STORAGE_KEY}-dismissed`, 'true')
  }, [])

  if (!mounted || dismissed) return null

  const doneCount = completed.size
  const total = ITEMS.length
  const allDone = doneCount >= total

  if (allDone) return null

  const progress = (doneCount / total) * 100

  return (
    <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[var(--text-small)] font-semibold">Primeiros Passos</h3>
          <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-0.5">
            {doneCount} de {total} concluídos
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-[var(--text-caption)] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
          title="Ocultar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-[var(--accent-1)] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Items */}
      <div className="space-y-1">
        {ITEMS.map(item => {
          const done = completed.has(item.id)
          const content = (
            <div
              className={cn(
                'flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-colors cursor-pointer',
                done ? 'opacity-60' : 'hover:bg-[var(--surface-2)]/50'
              )}
              onClick={() => toggle(item.id)}
            >
              <div className={cn(
                'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                done
                  ? 'bg-[var(--accent-1)] border-[var(--accent-1)]'
                  : 'border-[var(--border-1)]'
              )}>
                {done && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className={cn(
                'text-[var(--text-small)]',
                done && 'line-through text-[var(--text-3)]'
              )}>
                {item.label}
              </span>
            </div>
          )

          if (item.href && !done) {
            return (
              <Link key={item.id} href={item.href} onClick={() => toggle(item.id)}>
                {content}
              </Link>
            )
          }
          return <div key={item.id}>{content}</div>
        })}
      </div>
    </div>
  )
}
