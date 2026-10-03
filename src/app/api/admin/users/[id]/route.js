// src/app/api/admin/users/[id]/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function requireAdmin(req) {
  try {
    const token =
      req.cookies.get('adminToken')?.value ||
      req.cookies.get('admin_token')?.value ||
      req.cookies.get('token')?.value

    if (!token) return null
    const decoded = verifyToken(token)
    if (!decoded) return null

    const targetId = decoded.userId || decoded.id || decoded.adminId
    if (!targetId) return null

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, isActive: true },
    })

    if (!user || !user.isActive || user.role?.toLowerCase() !== 'admin') {
      return null
    }

    return user
  } catch {
    return null
  }
}

export async function GET(req, context) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
        isPremium:        true,
        premiumExpiresAt: true,
        role:             true,
        deviceId:         true,
        profileImage:     true,
        createdAt:        true,
        updatedAt:        true,
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
                playLimit: true,
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