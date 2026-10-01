import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function requireAdmin(req) {
  const token = req.cookies.get('adminToken')?.value
  if (!token) return null
  const decoded = verifyToken(token)
  return decoded?.role === 'admin' ? decoded : null
}

export async function GET(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const where = {}
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      users: users.map(u => ({ ...u, _id: u.id })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Users API GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, action } = await req.json()
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    let updateData = {}

    if (action === 'block') {
      updateData = { isActive: false }
    } else if (action === 'unblock') {
      updateData = { isActive: true }
    } else if (action === 'reset-device') {
      updateData = { deviceId: null }
    } else if (action === 'activate-premium') {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 30)
      updateData = {
        isPremium: true,
        premiumExpiresAt: expiry,
      }
    } else if (action === 'deactivate-premium') {
      updateData = {
        isPremium: false,
        premiumExpiresAt: null,
      }
    } else {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      user: { ...updated, _id: updated.id },
      premiumExpiresAt: updated.premiumExpiresAt,
    })
  } catch (error) {
    console.error('Users PATCH action error:', error)
    return NextResponse.json({ error: 'Action execution failed' }, { status: 500 })
  }
}