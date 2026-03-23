'use client'

// Componente de rolagem horizontal com indicadores de gradiente nas bordas
import { useRef, useState, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ScrollableStripProps {
  children: ReactNode
  className?: string
}

export function ScrollableStrip({ children, className }: ScrollableStripProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  // Atualiza a visibilidade dos gradientes com base na posição de scroll
  const update = () => {
    const el = ref.current
    if (!el) return
    setShowLeft(el.scrollLeft > 4)
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', update); ro.disconnect() }
  }, [])

  return (
    <div className="relative">
      {/* Gradiente esquerdo — indica conteúdo oculto à esquerda */}
      {showLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--bg)] to-transparent z-10 pointer-events-none" />
      )}
      <div
        ref={ref}
        className={cn('overflow-x-auto scrollbar-none', className)}
      >
        {children}
      </div>
      {/* Gradiente direito — indica conteúdo oculto à direita */}
      {showRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--bg)] to-transparent z-10 pointer-events-none" />
      )}
    </div>
  )
}
