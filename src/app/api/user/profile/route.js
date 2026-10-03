// src/app/api/user/profile/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const token =
      req.cookies.get('token')?.value ||
      req.cookies.get('adminToken')?.value ||
      req.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const userId = decoded?.userId || decoded?.id
    if (!decoded || !userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Always fetch fresh, un-cached data directly from the DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        isEmailVerified: true,
        isMobileVerified: true,
        isActive: true,
        isPremium: true,
        premiumExpiresAt: true,
        role: true,
        profileImage: true,
        deviceId: true,
        videoPlays: {
          select: {
            videoId: true,
            playCount: true,
          },
        },
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User inactive or not found' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        _id: user.id,
      },
    })
  } catch (error) {
    console.error('User profile fetch error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}