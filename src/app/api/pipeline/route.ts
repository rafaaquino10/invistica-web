import { NextRequest, NextResponse } from 'next/server'
import { runPipeline, ingestAsset } from '@/lib/pipelines'

/**
 * POST /api/pipeline
 *
 * Trigger data ingestion pipeline.
 * For development and manual refresh only.
 */
export async function POST(request: NextRequest) {
  // In production, you'd want to add authentication here
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env['PIPELINE_API_KEY']

  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { tickers, batchSize, delayMs } = body

    if (tickers && !Array.isArray(tickers)) {
      return NextResponse.json({ error: 'tickers must be an array' }, { status: 400 })
    }

    // Run single asset or full pipeline
    if (tickers?.length === 1) {
      const result = await ingestAsset(tickers[0])
      return NextResponse.json(result)
    }

    const result = await runPipeline({
      tickers,
      batchSize: batchSize ?? 10,
      delayMs: delayMs ?? 1000,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Pipeline error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Pipeline failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pipeline
 *
 * Get pipeline status.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoints: {
      'POST /api/pipeline': 'Run pipeline',
    },
    examples: {
      'Run for specific tickers': {
        method: 'POST',
        body: { tickers: ['PETR4', 'VALE3'] },
      },
      'Run for all assets': {
        method: 'POST',
        body: {},
      },
    },
  })
}
