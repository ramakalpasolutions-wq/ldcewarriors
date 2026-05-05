// src/app/api/user/profile/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const deviceId = req.cookies.get('deviceId')?.value

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        role: true,
        isEmailVerified: true,
        isMobileVerified: true,
        isActive: true,
        deviceId: true,
        addressLine: true,
        addressCity: true,
        addressState: true,
        addressPincode: true,
        createdAt: true,
      }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (deviceId && user.deviceId && user.deviceId !== deviceId) {
      return NextResponse.json({ error: 'Session expired. Please login again.', deviceMismatch: true }, { status: 401 })
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
        endDate: { gt: new Date() },
      }
    })

    return NextResponse.json({
      success: true,
      user: { ...user, subscription: subscription || null },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}