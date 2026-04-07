/**
 * Mercado Pago webhook event processor.
 * Handles subscription and payment events with DB transaction safety.
 */

import type { PrismaClient } from '@prisma/client'
import { preApprovalClient, MP_SUBSCRIPTION_CONFIG } from './config'
import { logger } from '@/lib/utils/logger'

// Build reverse lookup: amount → plan
const PLAN_MAP = new Map<number, 'pro' | 'elite'>()
for (const [plan, intervals] of Object.entries(MP_SUBSCRIPTION_CONFIG)) {
  for (const interval of Object.values(intervals)) {
    PLAN_MAP.set(interval.amount, plan as 'pro' | 'elite')
  }
}

export interface ProcessResult {
  action: 'updated' | 'skipped' | 'logged'
  reason?: string
  userId?: string
  previousPlan?: string
  newPlan?: string
  mpStatus?: string
  [key: string]: unknown
}

export async function processSubscriptionEvent(
  tx: PrismaClient,
  data: Record<string, unknown>
): Promise<ProcessResult> {
  const rawData = data['data'] as Record<string, unknown> | undefined
  const preapprovalId = rawData?.['id']
  if (!preapprovalId) {
    return { action: 'skipped', reason: 'No preapproval ID in webhook data' }
  }

  if (!preApprovalClient) {
    return { action: 'skipped', reason: 'Mercado Pago client not configured' }
  }

  // Confirm status directly from MP API (don't trust webhook payload alone)
  const preapproval = await preApprovalClient.get({ id: String(preapprovalId) })
  const status = preapproval.status as string | undefined
  const autoRecurring = preapproval.auto_recurring as Record<string, unknown> | undefined
  const amount = autoRecurring?.['transaction_amount'] as number | undefined

  // Parse external_reference to find the user
  let externalRef: { userId?: string; plan?: string } | null = null
  try {
    const rawRef = preapproval.external_reference as string | undefined
    externalRef = rawRef ? JSON.parse(rawRef) : null
  } catch {
    logger.warn(`Invalid external_reference for preapproval ${preapprovalId}`)
  }

  if (!externalRef?.userId) {
    // Fallback: find user by preapprovalId
    const user = await (tx as unknown as PrismaClient).user.findFirst({
      where: { mercadoPagoPreapprovalId: String(preapprovalId) },
      select: { id: true, plan: true },
    })
    if (!user) {
      return { action: 'skipped', reason: 'User not found for preapproval' }
    }
    externalRef = { userId: user.id }
  }

  const userId = externalRef.userId!

  // Determine new plan based on status
  let newPlan: 'free' | 'pro' | 'elite' = 'free'
  if (status === 'authorized' && amount) {
    newPlan = PLAN_MAP.get(amount) ?? (externalRef.plan as 'pro' | 'elite') ?? 'free'
  }

  // Get current state
  const currentUser = await (tx as unknown as PrismaClient).user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  if (!currentUser) {
    return { action: 'skipped', reason: `User ${userId} not found in database` }
  }

  // Update user plan + link preapprovalId
  await (tx as unknown as PrismaClient).user.update({
    where: { id: userId },
    data: {
      plan: newPlan,
      mercadoPagoPreapprovalId: String(preapprovalId),
    },
  })

  logger.info(`User ${userId}: ${currentUser.plan} → ${newPlan} (MP status: ${status})`)

  return {
    action: 'updated',
    userId,
    previousPlan: currentUser.plan,
    newPlan,
    mpStatus: status,
  }
}

export async function processPaymentEvent(
  _tx: PrismaClient,
  data: Record<string, unknown>
): Promise<ProcessResult> {
  const rawData = data['data'] as Record<string, unknown> | undefined
  const paymentId = rawData?.['id']
  logger.info(`Payment event received: ${paymentId}`)
  return { action: 'logged', reason: `Payment ${paymentId} logged` }
}
