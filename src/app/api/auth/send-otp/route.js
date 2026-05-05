// src/app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { generateOTP, getOTPExpiry } from '@/lib/auth'

export async function POST(req) {
  try {
    const { userId, type } = await req.json()

    if (!userId || !type) {
      return NextResponse.json({ error: 'userId and type are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const otp    = generateOTP()
    const expiry = getOTPExpiry()

    await prisma.oTP.deleteMany({ where: { userId: user.id, type } })
    await prisma.oTP.create({
      data: {
        userId:     user.id,
        identifier: user.email,
        otp,
        type,
        expiresAt:  expiry,
      },
    })

    try {
      const { sendOTPEmail } = await import('@/lib/email')
      await sendOTPEmail({
        to:   user.email,
        otp,
        type: 'verification',
        name: user.fullName,
      })
      console.log(`✅ ${type} OTP email sent to ${user.email}`)
    } catch (e) {
      console.error(`❌ ${type} OTP email failed:`, e.message)
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}