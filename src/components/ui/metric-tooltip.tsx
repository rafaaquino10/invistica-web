'use client'

import type { ReactNode } from 'react'
import { Tooltip } from './tooltip'
import { GLOSSARY } from '@/lib/glossary'

interface MetricTooltipProps {
  /** Chave do GLOSSARY ou texto customizado */
  term: string
  /** Conteúdo tooltip customizado (sobrescreve GLOSSARY) */
  content?: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * Tooltip educativo para métricas financeiras.
 * Consulta automaticamente o GLOSSARY pelo `term`.
 * Se não encontrar no GLOSSARY e nenhum `content` for passado, renderiza children sem tooltip.
 */
export function MetricTooltip({ term, content, children, position = 'top' }: MetricTooltipProps) {
  const text = content ?? GLOSSARY[term]

  if (!text) {
    return <>{children}</>
  }

  return (
    <Tooltip
      content={
        <div className="max-w-[280px] whitespace-normal">
          <span className="font-semibold text-[var(--bg)]">{term}</span>
          <span className="mx-1 text-[var(--bg)] opacity-40">—</span>
          <span className="text-[var(--bg)] opacity-90">{text}</span>
        </div>
      }
      position={position}
    >
      {children}
    </Tooltip>
  )
}
