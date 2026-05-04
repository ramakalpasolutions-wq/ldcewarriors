// src/app/api/auth/reset-password/route.js  (updated — works for both modal and forgot-password flow)
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword, validatePassword } from '@/lib/auth'

export async function POST(req) {
  try {
    const { userId, otp, password, confirmPassword } = await req.json()

    if (!userId || !otp || !password || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    const pwVal = validatePassword(password)
    if (!pwVal.valid) {
      return NextResponse.json({ error: pwVal.message }, { status: 400 })
    }

    // Accept EITHER a fresh (unused) password-reset OTP
    // OR an already-used one (because verify-reset-otp already marked it used).
    // We check for an already-used OTP that was used within the last 5 minutes.
    const recentlyUsed = await prisma.oTP.findFirst({
      where: {
        userId,
        otp,
        type:      'password-reset',
        isUsed:    true,
        expiresAt: { gt: new Date(Date.now() - 5 * 60 * 1000) },
      },
    })

    const freshOtp = await prisma.oTP.findFirst({
      where: {
        userId,
        otp,
        type:      'password-reset',
        isUsed:    false,
        expiresAt: { gt: new Date() },
      },
    })

    if (!recentlyUsed && !freshOtp) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    // Mark fresh OTP as used if needed
    if (freshOtp) {
      await prisma.oTP.update({ where: { id: freshOtp.id }, data: { isUsed: true } })
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.update({
      where: { id: userId },
      data:  { password: hashedPassword, deviceId: null },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Send confirmation email (non-blocking)
    try {
      const { sendPasswordResetSuccessEmail } = await import('@/lib/email')
      await sendPasswordResetSuccessEmail({ to: user.email, name: user.fullName })
    } catch (e) {
      console.warn('Password reset email failed (non-blocking):', e.message)
    }

    return NextResponse.json({ success: true, message: 'Password reset successfully.' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Password reset failed' }, { status: 500 })
  }
}