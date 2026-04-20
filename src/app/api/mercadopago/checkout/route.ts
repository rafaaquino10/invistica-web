import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { preApprovalClient, MP_SUBSCRIPTION_CONFIG, MP_FREE_TRIAL, getPlanDisplayName, type PlanType, type BillingInterval } from '@/lib/mercadopago/config'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!preApprovalClient) {
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { plan, interval } = body as { plan: PlanType; interval: BillingInterval }

    if (!['pro', 'elite'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json({ error: 'Invalid interval' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const subConfig = MP_SUBSCRIPTION_CONFIG[plan as 'pro' | 'elite'][interval]
    const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'

    const externalReference = JSON.stringify({
      userId: dbUser.id,
      plan,
      interval,
    })

    const preapproval = await preApprovalClient.create({
      body: {
        reason: `Invística ${getPlanDisplayName(plan)} - ${interval === 'monthly' ? 'Mensal' : 'Anual'}`,
        auto_recurring: {
          frequency: subConfig.frequency,
          frequency_type: subConfig.frequencyType,
          transaction_amount: subConfig.amount,
          currency_id: 'BRL',
          free_trial: {
            frequency: MP_FREE_TRIAL.frequency,
            frequency_type: MP_FREE_TRIAL.frequency_type,
          },
        } as any,
        payer_email: user.email,
        back_url: `${baseUrl}/settings?tab=billing`,
        external_reference: externalReference,
        status: 'pending',
      },
    })

    return NextResponse.json({ url: preapproval.init_point })
  } catch (error) {
    console.error('Mercado Pago checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
