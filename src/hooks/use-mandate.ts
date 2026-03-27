'use client'

import { useState, useEffect, useCallback } from 'react'

export type Mandate = 'CONSERVADOR' | 'EQUILIBRADO' | 'ARROJADO'

const MANDATES: Mandate[] = ['CONSERVADOR', 'EQUILIBRADO', 'ARROJADO']
const STORAGE_KEY = 'investiq-mandate'
const DEFAULT_MANDATE: Mandate = 'EQUILIBRADO'

const MANDATE_META: Record<Mandate, { label: string; short: string; description: string; emoji: string }> = {
  CONSERVADOR: { label: 'Conservador', short: 'C', description: 'Foco em valuation, qualidade e baixo risco', emoji: '🛡️' },
  EQUILIBRADO: { label: 'Equilibrado', short: 'E', description: 'Pesos balanceados entre pilares', emoji: '⚖️' },
  ARROJADO: { label: 'Arrojado', short: 'A', description: 'Foco em growth e momentum', emoji: '🚀' },
}

/**
 * Global mandate selector — persisted to localStorage.
 * Used across Dashboard, Ativo Detail, Explorer, Heatmap, etc.
 */
export function useMandate() {
  const [mandate, setMandateState] = useState<Mandate>(DEFAULT_MANDATE)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && MANDATES.includes(stored as Mandate)) {
      setMandateState(stored as Mandate)
    }
  }, [])

  const setMandate = useCallback((m: Mandate) => {
    setMandateState(m)
    localStorage.setItem(STORAGE_KEY, m)
  }, [])

  return {
    mandate,
    setMandate,
    mandates: MANDATES,
    meta: MANDATE_META,
    currentMeta: MANDATE_META[mandate],
  }
}
