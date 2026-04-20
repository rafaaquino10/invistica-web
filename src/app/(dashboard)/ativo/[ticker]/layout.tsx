import { Metadata } from 'next'
import { prisma, isDemoMode } from '@/lib/prisma'
import { getAssetByTicker } from '@/lib/data-source'
import { getScoreLabel } from '@/lib/utils/formatters'

interface Props {
  params: Promise<{ ticker: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params
  const upperTicker = ticker.toUpperCase()

  // Demo mode - use mock data
  let asset: {
    ticker: string
    name: string
    type: string
    sector: string | null
    aqScores: Array<{ scoreTotal: number }>
    quotes: Array<{ close: number }>
  } | null = null

  if (isDemoMode) {
    const liveAsset = await getAssetByTicker(upperTicker)
    if (liveAsset) {
      asset = {
        ticker: liveAsset.ticker,
        name: liveAsset.name,
        type: liveAsset.type,
        sector: liveAsset.sector,
        aqScores: liveAsset.aqScore ? [{ scoreTotal: liveAsset.aqScore.scoreTotal }] : [],
        quotes: [{ close: liveAsset.price }],
      }
    }
  } else {
    const dbAsset = await prisma.asset.findUnique({
      where: { ticker: upperTicker },
      include: {
        aqScores: {
          where: { version: 'v1' },
          take: 1,
          orderBy: { calculatedAt: 'desc' },
        },
        quotes: {
          take: 1,
          orderBy: { date: 'desc' },
        },
      },
    })
    if (dbAsset) {
      asset = {
        ticker: dbAsset.ticker,
        name: dbAsset.name,
        type: dbAsset.type,
        sector: dbAsset.sector,
        aqScores: dbAsset.aqScores.map((s) => ({ scoreTotal: Number(s.scoreTotal) })),
        quotes: dbAsset.quotes.map((q) => ({ close: Number(q.close) })),
      }
    }
  }

  if (!asset) {
    return {
      title: `${upperTicker} - Ativo não encontrado | Invística`,
      description: `O ativo ${upperTicker} não foi encontrado em nossa base de dados.`,
    }
  }

  const score = asset.aqScores[0] ? Number(asset.aqScores[0].scoreTotal) : null
  const price = asset.quotes[0] ? Number(asset.quotes[0].close) : null
  const scoreLabel = score !== null ? getScoreLabel(score) : null

  const title = `${upperTicker} - ${asset.name} | Invística`
  const description = score !== null
    ? `Análise completa de ${upperTicker} (${asset.name}). Invscore: ${score.toFixed(0)} (${scoreLabel}). ${asset.type === 'fii' ? 'Fundo Imobiliário' : 'Ação'} do setor ${asset.sector ?? 'N/A'}.`
    : `Análise de ${upperTicker} (${asset.name}). ${asset.type === 'fii' ? 'Fundo Imobiliário' : 'Ação'} do setor ${asset.sector ?? 'N/A'}.`

  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'https://invistica.com.br'

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
      'Invscore',
    ].filter(Boolean),
    authors: [{ name: 'Invística' }],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/ativo/${upperTicker}`,
      siteName: 'Invística',
      images: [
        {
          url: `${baseUrl}/api/og?ticker=${upperTicker}`,
          width: 1200,
          height: 630,
          alt: `${upperTicker} - Invscore`,
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
