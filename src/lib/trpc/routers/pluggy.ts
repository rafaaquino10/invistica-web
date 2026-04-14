import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { investiq } from '@/lib/investiq-client'

export const pluggyRouter = router({
  /** Gera connect token via backend para abrir o widget Pluggy */
  connectToken: protectedProcedure.mutation(async () => {
    try {
      const res = await investiq.post<{ accessToken: string }>(
        '/pluggy/connect-token',
        { timeout: 15000 },
      )
      return { accessToken: res.accessToken }
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Falha ao gerar token de conexao Open Finance',
        cause: error,
      })
    }
  }),

  /** Importa posições de um item conectado via Pluggy */
  importPositions: protectedProcedure
    .input(z.object({ itemId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const res = await investiq.post<{
          success: boolean
          item_id: string
          imported: number
          updated: number
          skipped: number
          errors: number
          details: Array<{
            ticker: string
            action: 'IMPORTED' | 'UPDATED' | 'SKIPPED' | 'ERROR'
            quantity?: number
            avg_price?: number
            reason?: string
          }>
        }>('/pluggy/import', {
          body: { item_id: input.itemId },
          timeout: 30000,
        })
        return res
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha ao importar posicoes da corretora',
          cause: error,
        })
      }
    }),
})
