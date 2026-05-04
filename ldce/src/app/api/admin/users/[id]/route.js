// src/app/api/admin/users/[id]/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function requireAdmin(req) {
  const token = req.cookies.get('adminToken')?.value
  if (!token) return null
  const decoded = verifyToken(token)
  return decoded?.role === 'admin' ? decoded : null
}

export async function GET(req, context) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Next.js 15: params is a Promise — must await it
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id:               true,
        fullName:         true,
        email:            true,
        mobile:           true,
        addressLine:      true,
        addressCity:      true,
        addressState:     true,
        addressPincode:   true,
        isEmailVerified:  true,
        isMobileVerified: true,
        isActive:         true,
        role:             true,
        deviceId:         true,
        profileImage:     true,
        createdAt:        true,
        updatedAt:        true,

        // All subscriptions (full history)
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          select: {
            id:                true,
            status:            true,
            amount:            true,
            currency:          true,
            startDate:         true,
            endDate:           true,
            couponCode:        true,
            discountAmount:    true,
            razorpayOrderId:   true,
            razorpayPaymentId: true,
            createdAt:         true,
          },
        },

        // Video play history with video info
        videoPlays: {
          orderBy: { lastPlayed: 'desc' },
          take: 50,
          select: {
            id:         true,
            playCount:  true,
            lastPlayed: true,
            video: {
              select: {
                id:        true,
                title:     true,
                thumbnail: true,
                type:      true,
                duration:  true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: { ...user, _id: user.id },
    })
  } catch (error) {
    console.error('User detail GET:', error)
    return NextResponse.json({ error: 'Failed to fetch user detail' }, { status: 500 })
  }
}