'use client'

/**
 * Disclaimer CVM — aviso legal para telas com dados financeiros.
 *
 * Variantes:
 * - "footer": Linha sutil no rodapé da página
 * - "banner": Banner fixo no topo (para primeira vez — dismissível via localStorage)
 * - "inline": Texto inline pequeno (para cards de score)
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DisclaimerProps {
  variant?: 'footer' | 'banner' | 'inline'
  className?: string
}

const DISCLAIMER_TEXT = {
  full: 'As informações apresentadas nesta plataforma têm caráter exclusivamente informativo e educacional. Não constituem recomendação de investimento, oferta ou solicitação de compra ou venda de qualquer ativo financeiro. Decisões de investimento são de inteira responsabilidade do investidor. Rentabilidade passada não é garantia de resultados futuros.',
  short: 'Informações para fins educacionais. Não constitui recomendação de investimento. Rentabilidade passada não garante resultados futuros.',
  micro: 'Não é recomendação de investimento.',
}

export function Disclaimer({ variant = 'footer', className }: DisclaimerProps) {
  const [dismissed, setDismissed] = useState(true) // Assume dispensado para evitar flash

  useEffect(() => {
    if (variant !== 'banner') return
    const accepted = localStorage.getItem('aq-disclaimer-accepted')
    if (!accepted) setDismissed(false)
  }, [variant])

  function handleAccept() {
    localStorage.setItem('aq-disclaimer-accepted', 'true')
    setDismissed(true)
  }

  if (variant === 'banner') {
    if (dismissed) return null
    return (
      <div
        className={cn(
          'w-full border border-[var(--border)] bg-[var(--surface-1)] rounded-lg px-4 py-3 mb-4',
          'flex flex-col sm:flex-row sm:items-center gap-3',
          className
        )}
      >
        <p className="flex-1 text-xs text-[var(--text-2)] leading-relaxed">
          {DISCLAIMER_TEXT.full}
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-colors"
        >
          Entendi
        </button>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <span className={cn('text-[10px] text-[var(--text-3)]', className)}>
        {DISCLAIMER_TEXT.micro}
      </span>
    )
  }

  // footer (default)
  return (
    <div className={cn('border-t border-[var(--border)] py-3', className)}>
      <p className="text-xs text-[var(--text-3)]">
        {DISCLAIMER_TEXT.short}
      </p>
    </div>
  )
}
