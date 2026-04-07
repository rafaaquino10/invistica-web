import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { preApprovalClient } from '@/lib/mercadopago/config'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const authUser = await getCurrentUser()

    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    })

    if (!user?.mercadoPagoPreapprovalId || !preApprovalClient) {
      return NextResponse.json({
        status: 'none',
        plan: user?.plan ?? 'free',
      })
    }

    const preapproval = await preApprovalClient.get({
      id: user.mercadoPagoPreapprovalId,
    })

    return NextResponse.json({
      status: preapproval.status,
      plan: user.plan,
      nextPaymentDate: preapproval.next_payment_date,
      autoRecurring: preapproval.auto_recurring,
    })
  } catch (error) {
    console.error('Manage subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser2 = await getCurrentUser()

    if (!authUser2?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body as { action: string }

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser2.email },
    })

    if (!user?.mercadoPagoPreapprovalId || !preApprovalClient) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    await preApprovalClient.update({
      id: user.mercadoPagoPreapprovalId,
      body: { status: 'cancelled' },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { plan: 'free' },
    })

    logger.info(`User ${user.id} cancelled subscription`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
