// src/app/api/auth/verify-reset-otp/route.js
// New lightweight endpoint — just verifies the OTP without logging in
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(req) {
  try {
    const { userId, otp } = await req.json()

    if (!userId || !otp) {
      return NextResponse.json({ error: 'userId and otp are required' }, { status: 400 })
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId,
        otp,
        type:      'password-reset',
        isUsed:    false,
        expiresAt: { gt: new Date() },
      },
    })

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    // Mark as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data:  { isUsed: true },
    })

    return NextResponse.json({ success: true, message: 'OTP verified' })
  } catch (error) {
    console.error('Verify reset OTP error:', error)
    return NextResponse.json({ error: 'OTP verification failed' }, { status: 500 })
  }
}