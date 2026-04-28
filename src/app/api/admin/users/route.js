// src/app/api/admin/users/route.js
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
    const page   = parseInt(searchParams.get('page')  || '1')
    const limit  = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const where = { role: 'user' }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email:    { contains: search, mode: 'insensitive' } },
        { mobile:   { contains: search } },
      ]
    }

    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, fullName: true, email: true, mobile: true,
          isEmailVerified: true, isMobileVerified: true,
          isActive: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const userIds = users.map(u => u.id)
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: { in: userIds },
        status: 'active',
        endDate: { gt: new Date() },
      },
    })

    const subMap = {}
    subscriptions.forEach(s => { subMap[s.userId] = s })

    const enrichedUsers = users.map(u => ({
      ...u,
      _id: u.id,
      subscription: subMap[u.id] || null,
    }))

    return NextResponse.json({
      success: true,
      users: enrichedUsers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Users GET:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, action } = await req.json()
    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updateData = {}
    if      (action === 'block')        updateData.isActive = false
    else if (action === 'unblock')      updateData.isActive = true
    else if (action === 'reset-device') updateData.deviceId = null
    else return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    await prisma.user.update({ where: { id }, data: updateData })
    return NextResponse.json({ success: true, message: `User ${action} successful` })
  } catch (error) {
    console.error('Users PATCH:', error)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}