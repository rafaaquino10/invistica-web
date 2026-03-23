'use client'

import { Glossary } from '@/components/education/glossary'

export default function GlossarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">
          Glossário Financeiro
        </h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Termos e indicadores usados na plataforma aQ Invest, explicados de forma simples.
        </p>
      </div>
      <Glossary />
    </div>
  )
}
