/**
 * Mercado Pago webhook signature validation.
 * Validates HMAC-SHA256 from x-signature header.
 */

import crypto from 'crypto'

export function validateWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!xSignature) return false

  // Parse x-signature header: "ts=xxx,v1=xxx"
  const parts: Record<string, string> = {}
  for (const part of xSignature.split(',')) {
    const [key, value] = part.split('=', 2)
    if (key && value) {
      parts[key.trim()] = value.trim()
    }
  }

  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  // Reject events older than 5 minutes (replay protection)
  const eventTime = parseInt(ts, 10) * 1000
  if (Date.now() - eventTime > 5 * 60 * 1000) return false

  // Build the manifest string per MP documentation
  const requestId = xRequestId ?? ''
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`

  const computed = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex')

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(computed))
  } catch {
    return false
  }
}
