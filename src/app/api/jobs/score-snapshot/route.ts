/**
 * Job de snapshot semanal de scores.
 *
 * POST /api/jobs/score-snapshot
 *   - Acionado pelo cron do Vercel (vercel.json)
 *   - Protegido por CRON_SECRET no header Authorization
 *   - Percorre todos os assets com score calculado e grava/atualiza
 *     um ScoreSnapshot para a data de hoje no banco.
 *
 * Idempotente: usa upsert com chave composta (ticker + snapshotDate).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAssets } from '@/lib/data-source'
import { getCurrentRegime } from '@/lib/data-source'
import { prisma, isDemoMode } from '@/lib/prisma'

const BATCH_SIZE = 50

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ─── Auth: verificar CRON_SECRET ─────────────────────────────────
  const cronSecret = process.env['CRON_SECRET']
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  }

  // ─── Guard: sem banco em demo mode ───────────────────────────────
  if (isDemoMode) {
    return NextResponse.json({ skipped: true, reason: 'demo_mode' })
  }

  const startedAt = Date.now()
  const snapshotDate = new Date()
  snapshotDate.setHours(0, 0, 0, 0) // normalizar para meia-noite UTC

  try {
    // ─── 1. Carregar dataset atual ────────────────────────────────
    const assets = await getAssets()
    const regime = getCurrentRegime()

    // Apenas assets com score calculado
    const scored = assets.filter(a => a.aqScore !== null && !a.killSwitch?.triggered)

    // ─── 2. Upsert em batches ─────────────────────────────────────
    let saved = 0
    let errors = 0

    for (let i = 0; i < scored.length; i += BATCH_SIZE) {
      const batch = scored.slice(i, i + BATCH_SIZE)

      await Promise.allSettled(
        batch.map(async (asset) => {
          const score = asset.aqScore!
          const breakdown = asset.scoreBreakdown

          try {
            await prisma.scoreSnapshot.upsert({
              where: {
                ticker_snapshotDate: {
                  ticker: asset.ticker,
                  snapshotDate,
                },
              },
              update: {
                scoreTotal:     score.scoreTotal,
                scoreValuation: score.scoreValuation,
                scoreQuality:   score.scoreQuality,
                scoreRisk:      score.scoreRisk,
                scoreDividends: score.scoreDividends,
                scoreGrowth:    score.scoreGrowth,
                scoreMomentum:  (breakdown?.pilares as any)?.momentum?.nota ?? null,
                classificacao:  breakdown?.classificacao ?? classificarScore(score.scoreTotal),
                regime:         regime?.regime ?? null,
                macroFactor:    breakdown?.ajustes?.fatorMacro ?? null,
                confidence:     score.confidence ?? null,
                sector:         asset.sector ?? null,
                price:          asset.price ?? null,
              },
              create: {
                ticker:         asset.ticker,
                snapshotDate,
                scoreTotal:     score.scoreTotal,
                scoreValuation: score.scoreValuation,
                scoreQuality:   score.scoreQuality,
                scoreRisk:      score.scoreRisk,
                scoreDividends: score.scoreDividends,
                scoreGrowth:    score.scoreGrowth,
                scoreMomentum:  (breakdown?.pilares as any)?.momentum?.nota ?? null,
                classificacao:  breakdown?.classificacao ?? classificarScore(score.scoreTotal),
                regime:         regime?.regime ?? null,
                macroFactor:    breakdown?.ajustes?.fatorMacro ?? null,
                confidence:     score.confidence ?? null,
                sector:         asset.sector ?? null,
                price:          asset.price ?? null,
              },
            })
            saved++
          } catch {
            errors++
          }
        })
      )
    }

    const elapsed = Date.now() - startedAt

    return NextResponse.json({
      ok: true,
      snapshotDate: snapshotDate.toISOString().split('T')[0],
      total: scored.length,
      saved,
      errors,
      elapsedMs: elapsed,
    })
  } catch (err) {
    console.error('[job/score-snapshot] Falha:', err)
    return NextResponse.json(
      { error: 'Falha ao gravar snapshots', detail: (err as Error).message },
      { status: 500 }
    )
  }
}

// ─── Health check ────────────────────────────────────────────────────
export async function GET(): Promise<NextResponse> {
  if (isDemoMode) {
    return NextResponse.json({ status: 'demo_mode', total: 0, tickers: 0 })
  }

  try {
    const [total, distinct] = await Promise.all([
      prisma.scoreSnapshot.count(),
      prisma.scoreSnapshot.groupBy({ by: ['ticker'], _count: true }),
    ])

    const newest = await prisma.scoreSnapshot.findFirst({
      orderBy: { snapshotDate: 'desc' },
      select: { snapshotDate: true },
    })

    return NextResponse.json({
      status: 'ok',
      total,
      tickers: distinct.length,
      newestDate: newest?.snapshotDate ?? null,
    })
  } catch (err) {
    return NextResponse.json(
      { status: 'error', detail: (err as Error).message },
      { status: 500 }
    )
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function classificarScore(score: number): string {
  if (score >= 81) return 'Excepcional'
  if (score >= 61) return 'Saudável'
  if (score >= 31) return 'Atenção'
  return 'Crítico'
}
