import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')?.toUpperCase()

  if (!ticker) {
    // Default OG image for the site
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #1A73E8 0%, #0D9488 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: 'white', fontSize: '36px', fontWeight: 'bold' }}>IQ</span>
            </div>
            <span style={{ color: 'white', fontSize: '60px', fontWeight: 'bold' }}>-Invest</span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '28px', textAlign: 'center', maxWidth: '600px' }}>
            Análise fundamentalista de ações brasileiras
          </p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }

  // Score display defaults (OG image is static, score computed client-side)
  const score: number | null = null
  const scoreColor = '#1A73E8'
  const scoreLabel = 'IQ-Score'

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: '60px',
        }}
      >
        {/* Left side - Asset info */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#94A3B8', fontSize: '24px', fontWeight: 'bold' }}>
                {ticker.slice(0, 2)}
              </span>
            </div>
            <span style={{ color: 'white', fontSize: '48px', fontWeight: 'bold' }}>{ticker}</span>
          </div>

          <p style={{ color: '#94A3B8', fontSize: '24px', marginBottom: '40px' }}>
            Análise completa com IQ-Score
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1A73E8 0%, #0D9488 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
>
              <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>IQ</span>
            </div>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>InvestIQ</span>
          </div>
        </div>

        {/* Right side - Score */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '100px',
              border: `8px solid ${scoreColor}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontSize: '72px', fontWeight: 'bold' }}>{score ?? 'IQ'}</span>
          </div>
          <span style={{ color: scoreColor, fontSize: '28px', fontWeight: 'bold', marginTop: '20px' }}>
            {scoreLabel}
          </span>
          <span style={{ color: '#94A3B8', fontSize: '20px', marginTop: '8px' }}>IQ-Score</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
