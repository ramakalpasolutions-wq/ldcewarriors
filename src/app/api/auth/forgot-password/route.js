// src/app/api/auth/forgot-password/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { generateOTP, getOTPExpiry } from '@/lib/auth'

export async function POST(req) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, you will receive an OTP.',
      })
    }

    const otp    = generateOTP()
    const expiry = getOTPExpiry()

    await prisma.oTP.deleteMany({ where: { userId: user.id, type: 'password-reset' } })
    await prisma.oTP.create({
      data: {
        userId:     user.id,
        identifier: user.email,
        otp,
        type:       'password-reset',
        expiresAt:  expiry,
      },
    })

    try {
      const { sendOTPEmail } = await import('@/lib/email')
      await sendOTPEmail({
        to:   user.email,
        otp,
        type: 'password-reset',
        name: user.fullName,
      })
      console.log('✅ Password reset OTP sent to', user.email)
    } catch (emailErr) {
      console.error('❌ Password reset email failed:', emailErr.message)
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email address.',
      userId:  user.id,
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 })
  }
}