// ─── Cron Job: Relatório Semanal ─────────────────────────────
// Executa semanalmente (sextas 19h UTC) para gerar e enviar
// relatórios semanais para usuários com notificações ativas.
//
// Vercel Cron: configurado em vercel.json
// Segurança: CRON_SECRET header para evitar execução não-autorizada

import { NextResponse } from 'next/server'
import { getAssets } from '@/lib/data-source'
import { generateWeeklyReport, enrichReportWithAI, formatReportAsText } from '@/lib/reports/weekly-report'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { generateWeeklyEmailHtml } from '@/lib/email/weekly-email-template'
import { isDemoMode } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  // Verificar CRON_SECRET em produção
  const cronSecret = process.env['CRON_SECRET']
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const assets = await getAssets()

    // Gerar relatório (sem dados de portfólio individual — batch job)
    // Enriquecer com narrativa IA (Claude Haiku) quando disponível
    const baseReport = generateWeeklyReport(assets, null)
    const report = await enrichReportWithAI(baseReport)

    if (isDemoMode) {
      return NextResponse.json({
        status: 'demo-mode',
        message: 'Relatório gerado mas não enviado (modo demo)',
        report: {
          period: report.period,
          marketOverview: report.marketOverview,
          insightsCount: report.insights.length,
          alertsCount: report.alerts.length,
        },
      })
    }

    // Em produção, buscar usuários com emailNotifications ativado
    const { prisma: db } = await import('@/lib/prisma')
    // emailNotifications campo adicionado via migration pendente
    const users = await db.user.findMany({
      where: {
        emailNotifications: true,
        email: { not: null },
      } as any,
      select: { id: true, email: true, name: true },
    })

    if (!isEmailConfigured()) {
      return NextResponse.json({
        status: 'email-not-configured',
        usersEligible: users.length,
        report: { period: report.period },
      })
    }

    // Enviar emails
    let sent = 0
    let failed = 0
    const html = generateWeeklyEmailHtml(report)
    const text = formatReportAsText(report)

    for (const user of users) {
      if (!user.email) continue

      const result = await sendEmail({
        to: user.email,
        subject: `Relatório Semanal InvestIQ — ${report.period.from} a ${report.period.to}`,
        html,
        text,
      })

      if (result.success) {
        sent++
      } else {
        failed++
        console.error(`[weekly-report] Falha ao enviar para ${user.email}: ${result.error}`)
      }

      // Rate limit: 2 emails/segundo (Resend free tier)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return NextResponse.json({
      status: 'ok',
      period: report.period,
      emailsSent: sent,
      emailsFailed: failed,
      totalEligible: users.length,
    })
  } catch (err) {
    console.error('[weekly-report] Erro:', err)
    return NextResponse.json(
      { error: 'Falha ao gerar relatório semanal' },
      { status: 500 }
    )
  }
}
