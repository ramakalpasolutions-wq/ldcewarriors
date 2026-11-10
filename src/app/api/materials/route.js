// src/app/api/materials/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'
import { currentQuizUser, hasPremiumAccess, validObjectId } from '@/lib/quizAuth'

export const dynamic = 'force-dynamic'

/*
  GET /api/materials                → all active topics with textbook counts
  GET /api/materials?topic=<id>     → that topic + its published textbooks
  GET /api/materials?topic=general  → textbooks with no topic
*/
export async function GET(req) {
  try {
    const topicParam = new URL(req.url).searchParams.get('topic')

    if (topicParam) {
      const isGeneral = topicParam === 'general'
      if (!isGeneral && !validObjectId(topicParam)) {
        return NextResponse.json({ success: false, error: 'Invalid topic' }, { status: 400 })
      }

      const [topic, materials, user] = await Promise.all([
        isGeneral
          ? Promise.resolve({ id: 'general', name: 'General' })
          : prisma.topic.findUnique({
              where: { id: topicParam },
              select: { id: true, name: true, description: true, thumbnail: true },
            }),
        prisma.material.findMany({
          where: { isPublished: true, topicId: isGeneral ? null : topicParam },
          orderBy: [{ chapterNo: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true, title: true, chapterNo: true, description: true, order: true,
            pageCount: true, accessType: true, createdAt: true,
          },
        }),
        currentQuizUser(req),
      ])

      if (!topic) {
        return NextResponse.json({ success: false, error: 'Topic not found' }, { status: 404 })
      }

      // Premium textbooks are locked unless the visitor is an active family member
      const hasFamily = Boolean(requireAdmin(req)) || hasPremiumAccess(user)
      // Order number first (1, 2, 3…); textbooks without one follow
      const byOrder = m => (m.order > 0 ? m.order : Infinity)
      materials.sort((a, b) => byOrder(a) - byOrder(b))

      const withLock = materials.map(m => ({
        ...m,
        locked: m.accessType === 'PREMIUM' && !hasFamily,
      }))

      return NextResponse.json(
        { success: true, topic, materials: withLock },
        { headers: { 'Cache-Control': 'private, no-store' } }
      )
    }

    const [topics, counts] = await Promise.all([
      prisma.topic.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, description: true, thumbnail: true },
      }),
      prisma.material.groupBy({
        by: ['topicId'],
        where: { isPublished: true },
        _count: { id: true },
      }),
    ])

    const countMap = Object.fromEntries(counts.map(c => [c.topicId ?? 'general', c._count.id]))
    const result = topics.map(t => ({ ...t, count: countMap[t.id] || 0 }))
    if (countMap.general) {
      result.push({ id: 'general', name: 'General', description: null, thumbnail: null, count: countMap.general })
    }

    return NextResponse.json({ success: true, topics: result })
  } catch (error) {
    console.error('Materials GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch textbooks' },
      { status: 500 }
    )
  }
}
