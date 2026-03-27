import { Metadata } from 'next'
import { getAssetByTicker } from '@/lib/data-source'
import { getScoreLabel } from '@/lib/utils/formatters'

interface Props {
  params: Promise<{ ticker: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params
  const upperTicker = ticker.toUpperCase()

  let asset: {
    ticker: string
    name: string
    type: string
    sector: string | null
    iqScores: Array<{ scoreTotal: number }>
    quotes: Array<{ close: number }>
  } | null = null

  const liveAsset = await getAssetByTicker(upperTicker)
  if (liveAsset) {
    asset = {
      ticker: liveAsset.ticker,
      name: liveAsset.name,
      type: liveAsset.type,
      sector: liveAsset.sector,
      iqScores: liveAsset.iqScore ? [{ scoreTotal: liveAsset.iqScore.scoreTotal }] : [],
      quotes: [{ close: liveAsset.price }],
    }
  }

  if (!asset) {
    return {
      title: `${upperTicker} - Ativo não encontrado | InvestIQ`,
      description: `O ativo ${upperTicker} não foi encontrado em nossa base de dados.`,
    }
  }

  const score = asset.iqScores[0] ? Number(asset.iqScores[0].scoreTotal) : null
  const price = asset.quotes[0] ? Number(asset.quotes[0].close) : null
  const scoreLabel = score !== null ? getScoreLabel(score) : null

  const title = `${upperTicker} - ${asset.name} | InvestIQ`
  const description = score !== null
    ? `Análise completa de ${upperTicker} (${asset.name}). IQ-Score: ${score.toFixed(0)} (${scoreLabel}). ${asset.type === 'fii' ? 'Fundo Imobiliário' : 'Ação'} do setor ${asset.sector ?? 'N/A'}.`
    : `Análise de ${upperTicker} (${asset.name}). ${asset.type === 'fii' ? 'Fundo Imobiliário' : 'Ação'} do setor ${asset.sector ?? 'N/A'}.`

  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'https://investiq.com.br'

  return {
    title,
    description,
    keywords: [
      upperTicker,
      asset.name,
      'análise fundamentalista',
      asset.type === 'fii' ? 'fundo imobiliário' : 'ação',
      asset.sector ?? '',
      'investimento',
      'bolsa brasileira',
      'B3',
      'IQ-Score',
    ].filter(Boolean),
    authors: [{ name: 'InvestIQ' }],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/ativo/${upperTicker}`,
      siteName: 'InvestIQ',
      images: [
        {
          url: `${baseUrl}/api/og?ticker=${upperTicker}`,
          width: 1200,
          height: 630,
          alt: `${upperTicker} - IQ-Score`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/api/og?ticker=${upperTicker}`],
    },
    alternates: {
      canonical: `${baseUrl}/ativo/${upperTicker}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function AssetLayout({ children }: { children: React.ReactNode }) {
  return children
}
