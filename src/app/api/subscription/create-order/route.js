// src/app/api/subscription/create-order/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

async function getLivePrice() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['subscriptionPrice', 'subscriptionMonths'] } },
    })
    const map = {}
    rows.forEach(r => { map[r.key] = parseInt(r.value) })
    return {
      price:  map.subscriptionPrice  ?? parseInt(process.env.SUBSCRIPTION_PRICE  ?? '999'),
      months: map.subscriptionMonths ?? parseInt(process.env.SUBSCRIPTION_MONTHS ?? '4'),
    }
  } catch {
    return {
      price:  parseInt(process.env.SUBSCRIPTION_PRICE  ?? '999'),
      months: parseInt(process.env.SUBSCRIPTION_MONTHS ?? '4'),
    }
  }
}

/* ── Shared coupon validation (no side effects) ── */
async function validateCoupon(couponCode, baseAmountPaise) {
  const coupon = await prisma.coupon.findFirst({
    where: {
      code:     couponCode.toUpperCase(),
      isActive: true,
      OR: [
        { expiryDate: { gt: new Date() } },
        { expiryDate: null },
      ],
    },
  })

  if (!coupon) {
    return { error: 'Invalid or expired coupon', status: 400 }
  }
  if (coupon.usedCount >= coupon.maxUses) {
    return { error: 'Coupon usage limit reached', status: 400 }
  }

  let discountPaise = 0
  if (coupon.discountType === 'percentage') {
    discountPaise = Math.floor((baseAmountPaise * coupon.discountValue) / 100)
  } else {
    discountPaise = coupon.discountValue * 100
  }

  const finalAmountPaise = Math.max(baseAmountPaise - discountPaise, 0)

  return {
    coupon,
    discountPaise,
    finalAmountPaise,
    discountAmount: discountPaise / 100,
    amount:         finalAmountPaise / 100,
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { couponCode, checkOnly = false } = body

    /* ══════════════════════════════════════════════════════
       CHECK-ONLY MODE — validate coupon, return preview
       No order created, no usedCount incremented
    ══════════════════════════════════════════════════════ */
    if (checkOnly) {
      // Still require auth for check-only
      const token = req.cookies.get('token')?.value
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const decoded = verifyToken(token)
      if (!decoded) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }

      if (!couponCode?.trim()) {
        return NextResponse.json({ error: 'Coupon code required' }, { status: 400 })
      }

      const { price: basePrice } = await getLivePrice()
      const baseAmountPaise = basePrice * 100

      const result = await validateCoupon(couponCode, baseAmountPaise)
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status },
        )
      }

      // Return preview — no DB writes
      return NextResponse.json({
        success:        true,
        valid:          true,
        amount:         result.amount,          // final price in ₹
        discountAmount: result.discountAmount,  // savings in ₹
        basePrice,
        couponCode:     couponCode.toUpperCase(),
        discountType:   result.coupon.discountType,
        discountValue:  result.coupon.discountValue,
      })
    }

    /* ══════════════════════════════════════════════════════
       REAL ORDER MODE — create Razorpay order
    ══════════════════════════════════════════════════════ */
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { price: basePrice } = await getLivePrice()
    let amountPaise     = basePrice * 100
    let discountPaise   = 0
    let appliedCoupon   = null

    // Apply coupon if provided
    if (couponCode?.trim()) {
      const result = await validateCoupon(couponCode, amountPaise)
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status },
        )
      }
      discountPaise = result.discountPaise
      amountPaise   = result.finalAmountPaise
      appliedCoupon = result.coupon
    }

    // Guard: Razorpay minimum is ₹1 (100 paise)
    if (amountPaise < 100) {
      return NextResponse.json(
        { error: 'Final amount after discount must be at least ₹1' },
        { status: 400 },
      )
    }

    // Build receipt (max 40 chars)
    const shortUserId = decoded.userId.slice(-8)
    const timestamp   = Date.now().toString(36)
    const receipt     = `ldce_${shortUserId}_${timestamp}`.substring(0, 40)

    console.log('📦 Creating Razorpay order:', {
      amount: amountPaise,
      receipt,
      userId: decoded.userId,
    })

    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        userId:   decoded.userId.substring(0, 50),
        platform: 'ldce',
      },
    })

    console.log('✅ Razorpay order created:', order.id)

    // Create pending subscription record
    await prisma.subscription.create({
      data: {
        userId:          decoded.userId,
        razorpayOrderId: order.id,
        amount:          amountPaise / 100,
        currency:        'INR',
        status:          'pending',
        couponCode:      couponCode?.trim() || null,
        discountAmount:  discountPaise / 100,
      },
    })

    // Increment coupon usedCount ONLY after order is successfully created
    if (appliedCoupon) {
      await prisma.coupon.update({
        where: { id: appliedCoupon.id },
        data:  { usedCount: { increment: 1 } },
      })
    }

    return NextResponse.json({
      success:        true,
      order,
      amount:         amountPaise / 100,
      discountAmount: discountPaise / 100,
      basePrice,
    })

  } catch (error) {
    console.error('Create order error:', error)
    const errorMsg =
      error?.error?.description ||
      error?.message ||
      'Failed to create order'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}