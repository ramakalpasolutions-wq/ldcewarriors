// src/app/api/videos/play/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { getSignedVideoUrl } from '@/lib/r2'

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { videoId } = await req.json()
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 })

    const video = await prisma.video.findUnique({ where: { id: videoId } })
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

    /* ── FREE VIDEO ── */
    if (video.type === 'free') {
      await prisma.video.update({
        where: { id: videoId },
        data: { views: { increment: 1 } },
      })

      // Generate signed URL (1 hour) or use public URL
      const streamUrl = video.videoKey
        ? await getSignedVideoUrl(video.videoKey, 3600)
        : video.videoUrl

      return NextResponse.json({ success: true, canPlay: true, streamUrl })
    }

    /* ── PREMIUM VIDEO ── */
    // 1. Check active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: decoded.userId,
        status: 'active',
        endDate: { gt: new Date() },
      },
    })

    if (!subscription) {
      return NextResponse.json({
        success: false, canPlay: false, reason: 'no_subscription',
      })
    }

    // 2. Find or create play record
    let playRecord = await prisma.videoPlay.findUnique({
      where: { userId_videoId: { userId: decoded.userId, videoId } },
    })

    if (!playRecord) {
      playRecord = await prisma.videoPlay.create({
        data: { userId: decoded.userId, videoId, playCount: 0 },
      })
    }

    const limit = video.playLimit || 3

    // 3. Check play limit
    if (playRecord.playCount >= limit) {
      return NextResponse.json({
        success: false, canPlay: false,
        reason: 'play_limit_exceeded',
        playCount: playRecord.playCount,
        limit,
      })
    }

    // 4. Increment play count
    playRecord = await prisma.videoPlay.update({
      where: { id: playRecord.id },
      data: { playCount: { increment: 1 }, lastPlayed: new Date() },
    })

    await prisma.video.update({
      where: { id: videoId },
      data: { views: { increment: 1 } },
    })

    // 5. Generate short-lived signed URL (2 hours for premium)
    const streamUrl = video.videoKey
      ? await getSignedVideoUrl(video.videoKey, 7200)
      : video.videoUrl

    return NextResponse.json({
      success: true,
      canPlay: true,
      streamUrl,
      playCount: playRecord.playCount,
      limit,
      remaining: limit - playRecord.playCount,
    })
  } catch (error) {
    console.error('Video play error:', error)
    return NextResponse.json({ error: 'Failed to process play request' }, { status: 500 })
  }
}