// src/app/api/admin/stats/route.js
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

    const [totalUsers, totalVideos, totalArticles, activeSubscriptions, recentUsers] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.video.count({ where: { isActive: true } }),
      prisma.article.count({ where: { isPublished: true } }),
      prisma.subscription.count({ where: { status: 'active', endDate: { gt: new Date() } } }),
      prisma.user.findMany({
        where: { role: 'user' },
        select: { id: true, fullName: true, email: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    return NextResponse.json({
      success: true,
      stats: { users: totalUsers, videos: totalVideos, articles: totalArticles, subscriptions: activeSubscriptions },
      recentUsers: recentUsers.map(u => ({ ...u, _id: u.id })),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}