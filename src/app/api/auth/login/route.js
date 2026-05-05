// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { comparePassword, generateOTP, getOTPExpiry } from '@/lib/auth'

export async function POST(req) {
  try {
    const { identifier, password } = await req.json()

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/Mobile and password are required' },
        { status: 400 },
      )
    }

    const isEmail = identifier.includes('@')
    const user = await prisma.user.findUnique({
      where: isEmail
        ? { email: identifier.toLowerCase() }
        : { mobile: identifier },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been suspended. Contact support.' },
        { status: 403 },
      )
    }
    if (!user.isEmailVerified || !user.isMobileVerified) {
      return NextResponse.json({
        error:             'Please verify your email before logging in.',
        userId:            user.id,
        needsVerification: true,
      }, { status: 403 })
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate email OTP for login
    const otp    = generateOTP()
    const expiry = getOTPExpiry()

    await prisma.oTP.deleteMany({ where: { userId: user.id, type: 'login' } })
    await prisma.oTP.create({
      data: {
        userId:     user.id,
        identifier: user.email,
        otp,
        type:       'login',
        expiresAt:  expiry,
      },
    })

    // Send OTP via email
    try {
      const { sendOTPEmail } = await import('@/lib/email')
      await sendOTPEmail({
        to:   user.email,
        otp,
        type: 'verification',
        name: user.fullName,
      })
      console.log('✅ Login OTP email sent to', user.email)
    } catch (emailErr) {
      console.error('❌ Login OTP email failed:', emailErr.message)
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your registered email address.',
      userId:  user.id,
      step:    'otp',
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 })
  }
}