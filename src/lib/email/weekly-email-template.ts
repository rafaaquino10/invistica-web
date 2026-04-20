// ─── Template HTML do Relatório Semanal ───────────────────────
// Gera email HTML responsivo com os dados do relatório semanal.

import type { WeeklyReportData } from '../reports/weekly-report'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function scoreColor(score: number): string {
  if (score >= 81) return '#00D4AA'
  if (score >= 61) return '#4ADE80'
  if (score >= 31) return '#FB923C'
  return '#EF4444'
}

function severityIcon(severity: string): string {
  switch (severity) {
    case 'critical': return '[!]'
    case 'warning': return '[*]'
    default: return '[i]'
  }
}

export function generateWeeklyEmailHtml(report: WeeklyReportData): string {
  const portfolioSection = report.portfolio ? `
    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: #1a1a2e; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Sua Carteira</h2>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 120px;">
          <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Patrimonio</div>
          <div style="color: #1a1a2e; font-size: 20px; font-weight: 700; margin-top: 4px;">${formatBRL(report.portfolio.totalValue)}</div>
        </div>
        <div style="flex: 1; min-width: 120px;">
          <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Rentabilidade</div>
          <div style="color: ${report.portfolio.gainLossPct >= 0 ? '#00D4AA' : '#EF4444'}; font-size: 20px; font-weight: 700; margin-top: 4px;">
            ${report.portfolio.gainLossPct >= 0 ? '+' : ''}${report.portfolio.gainLossPct.toFixed(2)}%
          </div>
        </div>
        <div style="flex: 1; min-width: 120px;">
          <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Invscore medio</div>
          <div style="color: ${scoreColor(report.portfolio.avgScore)}; font-size: 20px; font-weight: 700; margin-top: 4px;">
            ${report.portfolio.avgScore.toFixed(0)}
          </div>
        </div>
      </div>
    </div>
  ` : ''

  const alertsSection = report.alerts.length > 0 ? `
    <div style="background: #fff5f5; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #fed7d7;">
      <h2 style="color: #c53030; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Alertas (${report.alerts.length})</h2>
      ${report.alerts.slice(0, 5).map(alert => `
        <div style="padding: 8px 0; border-bottom: 1px solid #fed7d7;">
          <span>${severityIcon(alert.severity)}</span>
          <strong style="color: #1a1a2e;">${escapeHtml(alert.title)}</strong>
          <div style="color: #6b7280; font-size: 13px; margin-top: 2px;">${escapeHtml(alert.description)}</div>
        </div>
      `).join('')}
    </div>
  ` : ''

  const moversSection = `
    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: #1a1a2e; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Movimentacoes de Score</h2>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 150px;">
          <div style="color: #00D4AA; font-size: 13px; font-weight: 600; margin-bottom: 8px;">Maiores Altas</div>
          ${report.scoreMovers.gainers.length > 0
            ? report.scoreMovers.gainers.map(g => `
              <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px;">
                <span style="color: #1a1a2e; font-weight: 500;">${g.ticker}</span>
                <span style="color: #00D4AA; font-weight: 600;">+${g.delta.toFixed(0)} pts</span>
              </div>
            `).join('')
            : '<div style="color: #9ca3af; font-size: 13px;">Nenhuma alta significativa</div>'
          }
        </div>
        <div style="flex: 1; min-width: 150px;">
          <div style="color: #EF4444; font-size: 13px; font-weight: 600; margin-bottom: 8px;">Maiores Baixas</div>
          ${report.scoreMovers.losers.length > 0
            ? report.scoreMovers.losers.map(l => `
              <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px;">
                <span style="color: #1a1a2e; font-weight: 500;">${l.ticker}</span>
                <span style="color: #EF4444; font-weight: 600;">${l.delta.toFixed(0)} pts</span>
              </div>
            `).join('')
            : '<div style="color: #9ca3af; font-size: 13px;">Nenhuma baixa significativa</div>'
          }
        </div>
      </div>
    </div>
  `

  const insightsSection = report.insights.length > 0 ? `
    <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #bbf7d0;">
      <h2 style="color: #166534; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Insights da Semana</h2>
      ${report.insights.map(insight => `
        <div style="padding: 6px 0; color: #1a1a2e; font-size: 14px; line-height: 1.5;">
          • ${escapeHtml(insight)}
        </div>
      `).join('')}
    </div>
  ` : ''

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatorio Semanal Invística</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%); border-radius: 16px 16px 0 0; padding: 24px; text-align: center;">
      <div style="font-size: 28px; font-weight: 800; color: #0D9488; letter-spacing: -0.5px;">
        aQ<span style="color: #e4e4f0; font-weight: 400;">Invest</span>
      </div>
      <div style="color: #9ca3af; font-size: 13px; margin-top: 4px;">Relatorio Semanal</div>
      <div style="color: #6b7280; font-size: 12px; margin-top: 2px;">
        ${report.period.from} a ${report.period.to}
      </div>
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 24px; border-radius: 0 0 16px 16px;">
      <!-- Market Overview -->
      <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #bae6fd;">
        <h2 style="color: #0369a1; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Mercado</h2>
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <div>
            <span style="color: #6b7280; font-size: 12px;">Score medio B3:</span>
            <span style="color: ${scoreColor(report.marketOverview.avgScoreB3)}; font-weight: 700; margin-left: 4px;">${report.marketOverview.avgScoreB3}</span>
          </div>
          <div>
            <span style="color: #6b7280; font-size: 12px;">Setores em alta:</span>
            <span style="color: #00D4AA; font-weight: 600; margin-left: 4px;">${report.marketOverview.sectorsUp}</span>
          </div>
          <div>
            <span style="color: #6b7280; font-size: 12px;">Setores em baixa:</span>
            <span style="color: #EF4444; font-weight: 600; margin-left: 4px;">${report.marketOverview.sectorsDown}</span>
          </div>
        </div>
      </div>

      ${portfolioSection}
      ${alertsSection}
      ${moversSection}
      ${insightsSection}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 11px; line-height: 1.6;">
      <p style="margin: 0;">As analises apresentadas sao de carater informativo e educacional.</p>
      <p style="margin: 0;">Nao constituem recomendacao de investimento.</p>
      <p style="margin: 8px 0 0 0;">
        <a href="${process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://invistica.com.br'}/settings" style="color: #0D9488; text-decoration: none;">
          Gerenciar preferencias de email
        </a>
        &nbsp;|&nbsp;
        <a href="${process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://invistica.com.br'}/settings" style="color: #0D9488; text-decoration: none;">
          Cancelar inscricao
        </a>
      </p>
      <p style="margin: 8px 0 0 0; color: #d1d5db;">Invística &copy; ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
`
}
