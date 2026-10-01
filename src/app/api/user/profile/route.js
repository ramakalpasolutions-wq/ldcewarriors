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
        isPremium: true,
        premiumExpiresAt: true,
        deviceId: true,
        addressLine: true,
        addressCity: true,
        addressState: true,
        addressPincode: true,
        createdAt: true,
      }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Device lock check
    if (deviceId && user.deviceId && user.deviceId !== deviceId) {
      return NextResponse.json({ error: 'Session expired. Please login again.', deviceMismatch: true }, { status: 401 })
    }

    // Auto-expiry check: If expired, update DB status
    let isPremiumActive = user.isPremium
    if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) <= new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isPremium: false }
      })
      isPremiumActive = false
    }

    // Mock an active subscription object for backwards compatibility with legacy UI components
    const legacySubscriptionMock = isPremiumActive ? {
      status: 'active',
      startDate: user.createdAt,
      endDate: user.premiumExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    } : null;

    return NextResponse.json({
      success: true,
      user: { 
        ...user, 
        isPremium: isPremiumActive,
        subscription: legacySubscriptionMock 
      },
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}