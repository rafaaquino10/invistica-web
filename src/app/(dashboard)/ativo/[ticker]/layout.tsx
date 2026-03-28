import { Metadata } from 'next'

interface Props {
  params: Promise<{ ticker: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params
  const upperTicker = ticker.toUpperCase()

  // Fetch directly from API — no dependency on data-source which may fail
  let companyName = upperTicker
  let score: number | null = null

  try {
    const API_BASE = process.env['NEXT_PUBLIC_API_URL'] || 'https://investiqbackend-production.up.railway.app'
    const res = await fetch(`${API_BASE}/tickers/${upperTicker}`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      companyName = data.company_name ?? upperTicker
    }
  } catch {
    // API unavailable — use ticker as fallback
  }

  try {
    const API_BASE = process.env['NEXT_PUBLIC_API_URL'] || 'https://investiqbackend-production.up.railway.app'
    const res = await fetch(`${API_BASE}/scores/${upperTicker}`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      score = data.iq_cognit?.iq_score ?? null
    }
  } catch {
    // Score unavailable
  }

  const scoreLabel = score !== null
    ? (score >= 82 ? 'Compra Forte' : score >= 70 ? 'Acumular' : score >= 45 ? 'Manter' : score >= 30 ? 'Reduzir' : 'Evitar')
    : null

  const title = `${upperTicker} - ${companyName} | InvestIQ`
  const description = score !== null
    ? `Análise completa de ${upperTicker} (${companyName}). IQ-Score: ${score} (${scoreLabel}).`
    : `Análise de ${upperTicker} (${companyName}) na plataforma InvestIQ.`

  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'https://investiq.com.br'

  return {
    title,
    description,
    keywords: [upperTicker, companyName, 'análise fundamentalista', 'ação', 'B3', 'IQ-Score'],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/ativo/${upperTicker}`,
      siteName: 'InvestIQ',
      images: [{ url: `${baseUrl}/api/og?ticker=${upperTicker}`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default function AssetLayout({ children }: { children: React.ReactNode }) {
  return children
}
