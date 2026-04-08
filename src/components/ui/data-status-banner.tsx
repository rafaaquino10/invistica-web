'use client'

/**
 * Banner de degradação de dados.
 *
 * Exibido quando o gateway reporta status 'degraded' ou 'down'.
 * Atualiza a cada 5 minutos em background.
 * NÃO exibido quando tudo está 'ok' ou health check falha silenciosamente.
 */

import { useEffect, useState } from 'react'

interface GatewayStatus {
  status: 'ok' | 'degraded' | 'down'
}

export function DataStatusBanner() {
  const [status, setStatus] = useState<'ok' | 'degraded' | 'down' | null>(null)

  useEffect(() => {
    let cancelled = false

    async function checkHealth() {
      try {
        const res = await fetch(
          `${process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'https://investiqbackend-production.up.railway.app'}/health`,
          { cache: 'no-store', signal: AbortSignal.timeout(3000) }
        )
        if (!res.ok) return
        const data = (await res.json()) as GatewayStatus
        if (!cancelled) setStatus(data.status)
      } catch {
        // Falha silenciosa — não alarmar o usuário
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (!status || status === 'ok') return null

  if (status === 'down') {
    return (
      <div
        role="alert"
        className="w-full px-4 py-2 text-xs text-center bg-red-500/10 text-red-400 border-b border-red-500/20"
      >
        Dados de mercado temporariamente indisponíveis. Exibindo última atualização disponível.
      </div>
    )
  }

  // degraded
  return (
    <div
      role="status"
      className="w-full px-4 py-2 text-xs text-center bg-yellow-500/10 text-yellow-400 border-b border-yellow-500/20"
    >
      Alguns dados podem estar desatualizados. Reconectando...
    </div>
  )
}
