'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from './client'

export { trpc }

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return ''
  }
  if (process.env['VERCEL_URL']) {
    return `https://${process.env['VERCEL_URL']}`
  }
  return `http://localhost:${process.env['PORT'] ?? 3000}`
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // 2 min — dados financeiros precisam de frescor
            gcTime: 10 * 60 * 1000,   // 10 min — manter cache de dados não usados
            refetchOnWindowFocus: true, // re-buscar ao voltar para a aba
            refetchOnReconnect: true,   // re-buscar ao reconectar
            retry: 2,                   // tentar 2x em caso de falha
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
          },
        },
      })
  )

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
