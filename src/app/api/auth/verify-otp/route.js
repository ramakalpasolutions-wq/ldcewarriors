import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { generateToken, generateDeviceId } from '@/lib/auth'

export async function POST(req) {
  try {
    const { userId, otp, type, deviceId } = await req.json()

    if (!userId || !otp || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Accept both 'email' type (registration) and 'login' type (login flow)
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId,
        otp,
        type,
        isUsed:    false,
        expiresAt: { gt: new Date() },
      },
    })

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data:  { isUsed: true },
    })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ── Registration email verification ──
    if (type === 'email') {
      await prisma.user.update({
        where: { id: userId },
        data:  { isEmailVerified: true, isMobileVerified: true }, // single-step verification
      })
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully. You can now log in.',
      })
    }

    // ── Login OTP verification ──
    if (type === 'login') {
      const newDeviceId = deviceId || generateDeviceId()

      await prisma.user.update({
        where: { id: userId },
        data:  { deviceId: newDeviceId },
      })

      const token = generateToken({
        userId:   user.id,
        email:    user.email,
        role:     user.role,
        deviceId: newDeviceId,
      })

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id:        user.id,
          fullName:  user.fullName,
          email:     user.email,
          mobile:    user.mobile,
          role:      user.role,
          isPremium: user.isPremium || false,
        },
      })

      const cookieOptions = {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   60 * 60 * 24 * 7, // 7 days
      }

      // 1. Regular user session cookie
      response.cookies.set('token', token, cookieOptions)

      // 2. 🌟 IF ADMIN: Also set adminToken cookie for /admin access
      if (user.role === 'admin') {
        response.cookies.set('adminToken', token, cookieOptions)
      }

      // 3. Device tracking cookie
      response.cookies.set('deviceId', newDeviceId, {
        httpOnly: false,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   60 * 60 * 24 * 365,
      })

      return response
    }

    return NextResponse.json({ error: 'Unknown OTP type' }, { status: 400 })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'OTP verification failed' }, { status: 500 })
  }
}