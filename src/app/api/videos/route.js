// src/app/api/videos/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const type     = searchParams.get('type')
    const topicId  = searchParams.get('topicId')
    const homepage = searchParams.get('homepage')
    const limit    = parseInt(searchParams.get('limit') || '20')

    const where = { isActive: true }
    if (type)              where.type          = type
    if (topicId)           where.topicId       = topicId
    if (homepage === 'true') where.showOnHomepage = true

    const videos = await prisma.video.findMany({
      where,
      include: { topic: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    })

    /* ── Check subscription ── */
    const token = req.cookies.get('token')?.value
    let isSubscribed = false

    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        const sub = await prisma.subscription.findFirst({
          where: {
            userId: decoded.userId,
            status: 'active',
            endDate: { gt: new Date() },
          },
        })
        isSubscribed = !!sub
      }
    }

    const processedVideos = videos.map(video => {
      const base = {
        ...video,
        _id: video.id,
        topicId: video.topic
          ? { _id: video.topicId, name: video.topic.name, slug: video.topic.slug }
          : null,
        // Never expose videoKey publicly
        videoKey: undefined,
      }

      if (video.type === 'premium' && !isSubscribed) {
        return { ...base, videoUrl: null, isLocked: true }
      }
      return { ...base, isLocked: false }
    })

    return NextResponse.json({ success: true, videos: processedVideos })
  } catch (error) {
    console.error('Videos GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}