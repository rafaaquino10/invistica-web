'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[var(--text-1)] mb-2">Erro ao carregar dados</h2>
      <p className="text-sm text-[var(--text-2)] mb-6 text-center max-w-md">
        O backend pode estar temporariamente indisponível. Os dados serão carregados assim que o serviço estiver disponível.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-[var(--accent-1)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
      >
        Tentar novamente
      </button>
    </div>
  )
}
