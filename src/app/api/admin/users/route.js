// src/app/api/admin/users/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

/**
 * Robust Admin Token & Role Verifier
 */
async function verifyAdmin(req) {
  try {
    // 1. Check all possible cookie token names
    const token =
      req.cookies.get('admin_token')?.value ||
      req.cookies.get('adminToken')?.value ||
      req.cookies.get('token')?.value

    if (!token) return null

    // 2. Decode token
    const decoded = verifyToken(token)
    if (!decoded) return null

    const targetId = decoded.userId || decoded.id || decoded.adminId
    if (!targetId) return null

    // 3. Find user in database
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) return null

    // 4. Flexible role check (supports 'ADMIN', 'admin', etc.)
    const userRole = (user.role || '').toUpperCase()
    if (userRole !== 'ADMIN') {
      return null
    }

    return user
  } catch (err) {
    console.error('verifyAdmin error:', err)
    return null
  }
}

/* ─────────────────────────────────────────
   GET: FETCH PAGINATED & FILTERED USERS
───────────────────────────────────────── */
export async function GET(req) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
    const search = searchParams.get('search')?.trim() || ''

    // Build search query across Name, Email, and Mobile
    const whereClause = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}

    const [totalUsers, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          fullName: true,
          email: true,
          mobile: true,
          isEmailVerified: true,
          isMobileVerified: true,
          isPremium: true,
          premiumExpiresAt: true,
          isActive: true,
          deviceId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    // Map DB 'id' to '_id' for frontend compatibility
    const mappedUsers = users.map((u) => ({
      ...u,
      _id: u.id,
    }))

    return NextResponse.json({
      success: true,
      users: mappedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
      },
    })
  } catch (error) {
    console.error('Admin Fetch Users GET Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

/* ─────────────────────────────────────────
   PATCH: EXECUTE ADMIN ACTIONS ON A USER
───────────────────────────────────────── */
export async function PATCH(req) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 })
    }

    const body = await req.json()
    const { id: userId, action } = body

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: 'Missing userId or action parameters' }, { status: 400 })
    }

    // Verify Target User
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 })
    }

    /* ── BLOCK USER ── */
    if (action === 'block') {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      })
      return NextResponse.json({ success: true, message: 'User blocked successfully' })
    }

    /* ── UNBLOCK USER ── */
    if (action === 'unblock') {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      })
      return NextResponse.json({ success: true, message: 'User unblocked successfully' })
    }

    /* ── RESET DEVICE ID ── */
    if (action === 'reset-device') {
      await prisma.user.update({
        where: { id: userId },
        data: { deviceId: null },
      })
      return NextResponse.json({ success: true, message: 'Device session unlocked' })
    }

    /* ── 🌟 RESET ALL PLAY LIMITS BACK TO 0 (Reload 3 Plays) ── */
    if (action === 'reset-plays') {
      await prisma.videoPlay.updateMany({
        where: { userId: userId },
        data: { 
          playCount: 0, 
          lastPlayed: new Date(0) 
        },
      })
      return NextResponse.json({ success: true, message: 'All play limits reset to 0' })
    }

    /* ── ACTIVATE PREMIUM (JOIN FAMILY) ── */
    if (action === 'activate-premium') {
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)

      await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          premiumExpiresAt: expiryDate,
        },
      })
      return NextResponse.json({
        success: true,
        message: 'Activated Premium Membership',
        premiumExpiresAt: expiryDate,
      })
    }

    /* ── DEACTIVATE PREMIUM ── */
    if (action === 'deactivate-premium') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: false,
          premiumExpiresAt: null,
        },
      })
      return NextResponse.json({ success: true, message: 'Revoked Premium Membership' })
    }

    return NextResponse.json({ success: false, error: 'Unsupported Action Type' }, { status: 400 })
  } catch (error) {
    console.error('Admin PATCH Action Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to process admin action' }, { status: 500 })
  }
}