// Gerador de eventos reais do portfólio para o feed do Radar

export type EventType = 'score_change' | 'new_high' | 'new_low' | 'dividend' | 'alert_triggered'

export interface PortfolioEvent {
  id: string
  type: EventType
  ticker: string
  title: string
  message: string
  date: Date
  isRead: boolean
  category: string
  insightType?: string
}

export function generatePortfolioEvents(
  assets: Array<{ ticker: string; name: string; score?: number; changePercent?: number; close?: number }>,
  portfolioTickers: string[] = []
): PortfolioEvent[] {
  const now = new Date()
  const events: PortfolioEvent[] = []

  for (const asset of assets) {
    // Score alto → oportunidade
    if ((asset.score ?? 0) >= 80) {
      events.push({
        id: `score-high-${asset.ticker}`,
        type: 'score_change',
        ticker: asset.ticker,
        title: `${asset.ticker} com score excepcional`,
        message: `Score aQ de ${asset.score} — fundamentos sólidos destacam-se no setor`,
        date: new Date(now.getTime() - Math.random() * 86400000 * 2),
        isRead: false,
        category: 'opportunity',
      })
    }

    // Queda forte → risco
    if ((asset.changePercent ?? 0) <= -4) {
      events.push({
        id: `drop-${asset.ticker}`,
        type: 'alert_triggered',
        ticker: asset.ticker,
        title: `${asset.ticker} em queda expressiva`,
        message: `Variação de ${asset.changePercent?.toFixed(1)}% hoje — atenção ao suporte`,
        date: new Date(now.getTime() - Math.random() * 3600000 * 6),
        isRead: false,
        category: 'risk',
      })
    }

    // Alta forte → marco positivo
    if ((asset.changePercent ?? 0) >= 4) {
      events.push({
        id: `rise-${asset.ticker}`,
        type: 'new_high',
        ticker: asset.ticker,
        title: `${asset.ticker} em alta expressiva`,
        message: `Alta de ${asset.changePercent?.toFixed(1)}% hoje — possível rompimento de resistência`,
        date: new Date(now.getTime() - Math.random() * 3600000 * 8),
        isRead: false,
        category: 'milestone',
      })
    }

    // Ativo do portfólio com score médio → informativo
    if (portfolioTickers.includes(asset.ticker) && (asset.score ?? 0) >= 60 && (asset.score ?? 0) < 80) {
      events.push({
        id: `portfolio-${asset.ticker}`,
        type: 'score_change',
        ticker: asset.ticker,
        title: `${asset.ticker} monitorado`,
        message: `Score aQ de ${asset.score} — ativo da sua carteira com fundamentos saudáveis`,
        date: new Date(now.getTime() - Math.random() * 86400000 * 3),
        isRead: true,
        category: 'info',
      })
    }
  }

  // Limita a 20 eventos, ordena por data decrescente
  return events
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 20)
}
