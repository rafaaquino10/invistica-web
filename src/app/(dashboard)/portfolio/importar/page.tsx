'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui'
import { TickerLogo } from '@/components/ui/ticker-logo'
import { trpc } from '@/lib/trpc/provider'
import { cn } from '@/lib/utils'

const PluggyConnect = dynamic(
  () => import('react-pluggy-connect').then((m) => m.PluggyConnect),
  { ssr: false },
)

/* ── Types ── */

type Step = 'connect' | 'importing' | 'result'

interface ImportDetail {
  ticker: string
  action: 'IMPORTED' | 'UPDATED' | 'SKIPPED' | 'ERROR'
  quantity?: number
  avg_price?: number
  reason?: string
}

interface ImportResult {
  success: boolean
  item_id: string
  imported: number
  updated: number
  skipped: number
  errors: number
  details: ImportDetail[]
}

/* ── Config ── */

const BROKERS = [
  { name: 'XP Investimentos', initials: 'XP' },
  { name: 'Rico', initials: 'RI' },
  { name: 'Clear', initials: 'CL' },
  { name: 'BTG Pactual', initials: 'BT' },
  { name: 'Nu Invest', initials: 'NU' },
  { name: 'Inter', initials: 'IN' },
  { name: 'Genial', initials: 'GE' },
  { name: 'Modal', initials: 'MO' },
  { name: 'Orama', initials: 'OR' },
  { name: 'Guide', initials: 'GU' },
]

/* ── Helpers ── */

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtNum(v: number) {
  return v.toLocaleString('pt-BR')
}

function actionLabel(action: string) {
  if (action === 'IMPORTED') return 'Importado'
  if (action === 'UPDATED') return 'Atualizado'
  if (action === 'SKIPPED') return 'Ignorado'
  return 'Erro'
}

/* ── Page ── */

export default function ImportarPage() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [step, setStep] = useState<Step>('connect')
  const [showWidget, setShowWidget] = useState(false)
  const [connectToken, setConnectToken] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getConnectToken = trpc.pluggy.connectToken.useMutation()
  const importPositions = trpc.pluggy.importPositions.useMutation()

  const busy = getConnectToken.isPending || showWidget

  const handleConnect = useCallback(async () => {
    if (busy) return
    setError(null)

    try {
      const { accessToken } = await getConnectToken.mutateAsync()
      setConnectToken(accessToken)
      setShowWidget(true)
    } catch {
      setError('Nao foi possivel conectar ao servico Open Finance. Tente novamente.')
    }
  }, [getConnectToken, busy])

  const handleWidgetSuccess = useCallback(async ({ item }: { item: { id: string } }) => {
    setShowWidget(false)
    setStep('importing')

    try {
      const data = await importPositions.mutateAsync({ itemId: item.id })
      setImportResult(data as ImportResult)
      setStep('result')
      utils.portfolio.list.invalidate()
    } catch {
      setError('Erro ao importar posicoes. Sua corretora foi conectada -- tente re-sincronizar nas Configuracoes.')
      setStep('connect')
    }
  }, [importPositions, utils])

  const handleGoToPortfolio = () => {
    utils.portfolio.list.invalidate()
    router.push('/portfolio')
  }

  const handleReset = () => {
    setStep('connect')
    setImportResult(null)
    setError(null)
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[var(--text-title)] font-bold tracking-tight text-[var(--text-1)]">
          Importar Carteira
        </h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Conecte sua corretora e importe posicoes automaticamente via Open Finance
        </p>
      </div>

      {/* ═══ STATE A: CONNECT ═══ */}
      {step === 'connect' && (
        <div className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-1)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-2)] flex items-center justify-center text-[var(--accent-1)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div>
                <h2 className="text-[var(--text-subheading)] font-semibold text-[var(--text-1)]">
                  Conecte sua Corretora
                </h2>
                <p className="text-[var(--text-caption)] text-[var(--text-2)]">
                  Open Finance regulamentado pelo Banco Central
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            <p className="text-[var(--text-body)] text-[var(--text-2)] leading-relaxed max-w-xl mb-5">
              Conecte-se a sua corretora de forma segura. Suas posicoes em acoes serao
              importadas automaticamente para a Invística e analisadas pelo motor Invscore.
            </p>

            {/* Broker Grid */}
            <div className="grid grid-cols-5 gap-2.5 mb-6">
              {BROKERS.map((b) => (
                <div
                  key={b.initials}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-1)]"
                >
                  <div className="w-8 h-8 rounded-md bg-[var(--bg)] border border-[var(--border-1)] flex items-center justify-center font-mono text-[var(--text-caption)] font-bold text-[var(--text-3)]">
                    {b.initials}
                  </div>
                  <span className="text-[10px] text-[var(--text-3)] text-center leading-tight">
                    {b.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <p className="text-[var(--text-small)] text-[var(--neg)] text-center mb-4">{error}</p>
            )}

            {/* CTA */}
            <div className="flex justify-center mb-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleConnect}
                disabled={busy}
                className="px-8"
              >
                {getConnectToken.isPending ? 'Conectando...' : 'Conectar Corretora'}
              </Button>
            </div>

            {/* Feature pills */}
            <div className="flex justify-center gap-3">
              {['Criptografado', 'Somente leitura', 'Revogar a qualquer momento'].map((f) => (
                <span
                  key={f}
                  className="text-[10px] font-mono text-[var(--text-3)] border border-[var(--border-1)] rounded px-2 py-0.5"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-1)] bg-[var(--surface-2)]">
            <p className="text-[10px] text-[var(--text-3)] max-w-sm leading-relaxed">
              Conexao via Pluggy Open Finance, regulamentada pelo Banco Central do Brasil.
              Acesso somente leitura.
            </p>
            <Button variant="ghost" size="sm" onClick={() => router.push('/portfolio')}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {/* ═══ STATE B: IMPORTING ═══ */}
      {step === 'importing' && (
        <div className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-1)]">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-2)] flex items-center justify-center text-[var(--accent-1)] animate-spin">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <div>
              <h2 className="text-[var(--text-subheading)] font-semibold text-[var(--text-1)]">Importando Posicoes</h2>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Sincronizando com sua corretora</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full border-[3px] border-[var(--accent-1)] animate-pulse" />
            <p className="text-[var(--text-body)] font-medium text-[var(--text-1)]">
              Sincronizando posicoes...
            </p>
            <p className="text-[var(--text-small)] text-[var(--text-3)]">
              Isso pode levar alguns segundos
            </p>
          </div>
        </div>
      )}

      {/* ═══ STATE C: RESULT ═══ */}
      {step === 'result' && importResult && (
        <div className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-1)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--success-100)] flex items-center justify-center text-[var(--pos)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div>
                <h2 className="text-[var(--text-subheading)] font-semibold text-[var(--text-1)]">
                  Importacao Concluida
                </h2>
                <p className="text-[var(--text-caption)] text-[var(--text-2)]">
                  Posicoes sincronizadas com sucesso
                </p>
              </div>
            </div>
            <span className="text-[var(--text-caption)] font-mono font-semibold text-[var(--accent-1)] bg-[var(--accent-2)] px-2.5 py-1 rounded-md">
              {importResult.details.length} posicoes
            </span>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-px bg-[var(--border-1)] border-b border-[var(--border-1)]">
            {[
              { label: 'Importadas', value: importResult.imported, color: 'var(--pos)' },
              { label: 'Atualizadas', value: importResult.updated, color: 'var(--accent-1)' },
              { label: 'Ignoradas', value: importResult.skipped, color: 'var(--warn)' },
            ].map((s) => (
              <div key={s.label} className="bg-[var(--surface-1)] px-4 py-3 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-3)]">{s.label}</p>
                <p className="font-mono text-[var(--text-heading)] font-bold" style={{ color: s.color }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Detail Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-1)]">
                  <th className="text-left text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)] px-4 py-2.5">
                    Ativo
                  </th>
                  <th className="text-left text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)] px-4 py-2.5">
                    Status
                  </th>
                  <th className="text-right text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)] px-4 py-2.5">
                    Qtd
                  </th>
                  <th className="text-right text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)] px-4 py-2.5">
                    PM
                  </th>
                  <th className="text-left text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)] px-4 py-2.5">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody>
                {importResult.details.map((d) => (
                  <tr
                    key={d.ticker}
                    className="border-b border-[var(--border-1)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <TickerLogo ticker={d.ticker} size={28} />
                        <span className="font-mono font-bold text-[var(--text-body)] text-[var(--text-1)]">
                          {d.ticker}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          'inline-flex items-center text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded',
                          d.action === 'IMPORTED' && 'bg-[var(--success-100)] text-[var(--pos)]',
                          d.action === 'UPDATED' && 'bg-[var(--accent-2)] text-[var(--accent-1)]',
                          d.action === 'SKIPPED' && 'bg-[var(--warning-100)] text-[var(--warn)]',
                          d.action === 'ERROR' && 'bg-[var(--danger-100)] text-[var(--neg)]',
                        )}
                      >
                        {actionLabel(d.action)}
                      </span>
                    </td>
                    <td className="text-right px-4 py-2.5 font-mono text-[var(--text-body)] text-[var(--text-1)]">
                      {d.quantity != null ? fmtNum(d.quantity) : <span className="text-[var(--text-3)]">--</span>}
                    </td>
                    <td className="text-right px-4 py-2.5 font-mono text-[var(--text-body)] text-[var(--text-1)]">
                      {d.avg_price != null ? fmtBRL(d.avg_price) : <span className="text-[var(--text-3)]">--</span>}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-small)] text-[var(--text-3)] italic">
                      {d.reason || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-1)] bg-[var(--surface-2)]">
            <p className="text-[10px] text-[var(--text-3)] max-w-sm leading-relaxed">
              Posicoes importadas refletem os dados mais recentes da sua corretora.
              Ativos nao cobertos pelo motor Invscore foram ignorados.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Importar Outra
              </Button>
              <Button variant="primary" size="sm" onClick={handleGoToPortfolio}>
                Ver Carteira
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PLUGGY WIDGET ═══ */}
      {showWidget && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          onSuccess={handleWidgetSuccess}
          onError={() => {
            setShowWidget(false)
            setError('Erro na conexao com a corretora. Tente novamente.')
          }}
          onClose={() => setShowWidget(false)}
        />
      )}
    </div>
  )
}
