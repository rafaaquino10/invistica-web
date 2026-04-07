import { NextRequest, NextResponse } from 'next/server'
import { MP_CONFIG } from '@/lib/mercadopago/config'
import { prisma, isDemoMode } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'
import { validateWebhookSignature } from '@/lib/mercadopago/webhook-validator'
import { processSubscriptionEvent, processPaymentEvent, type ProcessResult } from '@/lib/mercadopago/event-processor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // HMAC validation ANTES de qualquer processamento
    if (!MP_CONFIG.webhookSecret) {
      logger.error('Webhook rejected: MERCADOPAGO_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 403 }
      )
    }

    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const dataId = body?.data?.id

    if (!dataId) {
      logger.error('Webhook rejected: missing data.id in payload')
      return NextResponse.json(
        { error: 'Missing data.id' },
        { status: 400 }
      )
    }

    const isValid = validateWebhookSignature(
      xSignature,
      xRequestId,
      String(dataId),
      MP_CONFIG.webhookSecret
    )

    if (!isValid) {
      logger.error('Webhook signature verification failed')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      )
    }

    const eventType = (body.type as string) ?? 'unknown'
    const action = (body.action as string) ?? null
    const eventId = String(body.id ?? dataId ?? `unknown-${Date.now()}`)

    // In demo mode, skip DB operations but still return success
    if (isDemoMode) {
      logger.info(`[demo] Webhook received: ${eventType} / ${eventId}`)
      return NextResponse.json({ ok: true, eventId, demo: true })
    }

    // ── Idempotency Check ──────────────────────────────────
    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId },
    })

    if (existing?.status === 'processed') {
      logger.info(`Webhook already processed: ${eventId}`)
      return NextResponse.json({ ok: true, message: 'Already processed', eventId })
    }

    // ── Register / Update Event ────────────────────────────
    const event = await prisma.webhookEvent.upsert({
      where: { eventId },
      create: {
        eventId,
        provider: 'mercadopago',
        eventType,
        action,
        payload: body,
        status: 'processing',
      },
      update: {
        attempts: { increment: 1 },
        status: 'processing',
      },
    })

    // ── Process Event ──────────────────────────────────────
    try {
      let result: ProcessResult

      switch (eventType) {
        case 'subscription_preapproval':
          result = await processSubscriptionEvent(prisma, body)
          break
        case 'payment':
          result = await processPaymentEvent(prisma, body)
          break
        default:
          result = { action: 'skipped', reason: `Unhandled event type: ${eventType}` }
          break
      }

      // Mark as processed
      const finalStatus = result['action'] === 'skipped' ? 'skipped' : 'processed'
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: finalStatus,
          result: JSON.parse(JSON.stringify(result)),
          processedAt: new Date(),
        },
      })

      return NextResponse.json({ ok: true, eventId, result })
    } catch (err) {
      // Mark as failed — MP will retry
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      })

      logger.error(`Webhook processing failed: ${eventId} — ${err instanceof Error ? err.message : err}`)
      return NextResponse.json(
        { error: 'Processing failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error(`Webhook handler error: ${error instanceof Error ? error.message : error}`)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
