// src/app/api/subscription/verify-payment/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { sendSubscriptionConfirmationEmail } from '@/lib/email'
import crypto from 'crypto'

// ── Helper: get duration months from DB ──
async function getSubscriptionMonths() {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: 'subscriptionMonths' },
    })
    return row ? parseInt(row.value) : parseInt(process.env.SUBSCRIPTION_MONTHS ?? '4')
  } catch {
    return parseInt(process.env.SUBSCRIPTION_MONTHS ?? '4')
  }
}

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    // ── Verify signature ──
    const body              = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Razorpay signature mismatch')
      return NextResponse.json(
        { error: 'Payment verification failed — invalid signature' },
        { status: 400 },
      )
    }

    // ── Get subscription duration from DB settings ──
    const months    = await getSubscriptionMonths()
    const startDate = new Date()
    const endDate   = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + months)

    console.log(`📅 Subscription duration: ${months} months → ends ${endDate.toISOString()}`)

    // ── Activate subscription ──
    const updated = await prisma.subscription.updateMany({
      where: { razorpayOrderId: razorpay_order_id, userId: decoded.userId },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status:    'active',
        startDate,
        endDate,
      },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Subscription record not found' }, { status: 404 })
    }

    console.log(`✅ Subscription activated for user ${decoded.userId} until ${endDate.toISOString()}`)

    // ── Send confirmation email (non-blocking) ──
    try {
      const user = await prisma.user.findUnique({
        where:  { id: decoded.userId },
        select: { email: true, fullName: true },
      })
      if (user?.email) {
        // Get the actual amount paid
        const sub = await prisma.subscription.findFirst({
          where:   { razorpayOrderId: razorpay_order_id },
          select:  { amount: true },
        })
        await sendSubscriptionConfirmationEmail({
          to:      user.email,
          name:    user.fullName || 'User',
          endDate,
          amount:  sub?.amount ?? 999,
        })
      }
    } catch (emailErr) {
      console.warn('⚠️ Email send error (non-blocking):', emailErr.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified. Premium access activated!',
      subscription: { startDate, endDate, status: 'active' },
    })
  } catch (error) {
    console.error('❌ Verify payment error:', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}