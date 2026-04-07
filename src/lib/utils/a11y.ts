// Utilitários de acessibilidade — WCAG 2.1 AA
import type { KeyboardEvent } from 'react'

/**
 * Torna um elemento div/span clicável via teclado (Enter + Space)
 * para casos onde <button> não pode ser usado.
 */
export function clickableProps(onClick: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    },
  }
}

/**
 * Formata um valor numérico para leitura por screen readers
 */
export function srNumber(value: number, suffix = ''): string {
  return `${value.toLocaleString('pt-BR')}${suffix}`
}

/**
 * Retorna aria-label para variações de preço
 */
export function srChangeLabel(value: number): string {
  if (value > 0) return `aumento de ${value.toFixed(2)} porcento`
  if (value < 0) return `queda de ${Math.abs(value).toFixed(2)} porcento`
  return 'sem variação'
}
