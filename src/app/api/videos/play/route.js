// src/app/api/videos/play/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { getSignedVideoUrl } from '@/lib/r2'

export async function POST(req) {
  try {
    const token =
      req.cookies.get('token')?.value ||
      req.cookies.get('adminToken')?.value ||
      req.cookies.get('admin_token')?.value

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    const userId = decoded?.userId || decoded?.id
    if (!decoded || !userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

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

      const streamUrl = video.videoKey
        ? await getSignedVideoUrl(video.videoKey, 3600)
        : video.videoUrl

      return NextResponse.json({ success: true, canPlay: true, streamUrl })
    }

    /* ── JOIN FAMILY (PREMIUM) VIDEO ── */
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isPremium: true, premiumExpiresAt: true, isActive: true, role: true }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        canPlay: false,
        reason: 'account_inactive',
      })
    }

    const isSubscribed = Boolean(
      (user.isPremium && (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date())) ||
      (user.role && user.role.toLowerCase() === 'admin')
    )

    if (!isSubscribed) {
      return NextResponse.json({
        success: false,
        canPlay: false,
        reason: 'no_subscription',
      })
    }

    const limit = video.playLimit || 3
    const now = new Date()

    // 1. Fetch current play record
    let playRecord = await prisma.videoPlay.findUnique({
      where: { userId_videoId: { userId: user.id, videoId } },
    })

    // 🌟 2. FIRST-TIME PLAY: Create atomically with playCount: 1
    if (!playRecord) {
      try {
        playRecord = await prisma.videoPlay.create({
          data: {
            userId: user.id,
            videoId,
            playCount: 1,
            lastPlayed: now,
          },
        })

        await prisma.video.update({
          where: { id: videoId },
          data: { views: { increment: 1 } },
        })

        const streamUrl = video.videoKey
          ? await getSignedVideoUrl(video.videoKey, 7200)
          : video.videoUrl

        return NextResponse.json({
          success: true,
          canPlay: true,
          streamUrl,
          playCount: 1,
          limit,
          remaining: limit - 1,
        })
      } catch (err) {
        // Handle concurrent creation
        playRecord = await prisma.videoPlay.findUnique({
          where: { userId_videoId: { userId: user.id, videoId } },
        })
        if (!playRecord) throw err
      }
    }

    // 🌟 3. 15-SECOND DEBOUNCE WINDOW: Do not deduct credit if called in quick succession
    const timeSinceLastPlay = now.getTime() - new Date(playRecord.lastPlayed).getTime()
    if (timeSinceLastPlay < 15000 && playRecord.playCount > 0) {
      const streamUrl = video.videoKey
        ? await getSignedVideoUrl(video.videoKey, 7200)
        : video.videoUrl

      return NextResponse.json({
        success: true,
        canPlay: true,
        streamUrl,
        playCount: playRecord.playCount,
        limit,
        remaining: Math.max(0, limit - playRecord.playCount),
      })
    }

    // 4. Check if play limit was already reached
    if (playRecord.playCount >= limit) {
      return NextResponse.json({
        success: false,
        canPlay: false,
        reason: 'play_limit_exceeded',
        playCount: playRecord.playCount,
        limit,
        remaining: 0,
      })
    }

    // 🌟 5. INCREMENT COUNT EXACTLY BY 1
    const updated = await prisma.videoPlay.update({
      where: { id: playRecord.id },
      data: {
        playCount: { increment: 1 },
        lastPlayed: now,
      },
    })

    await prisma.video.update({
      where: { id: videoId },
      data: { views: { increment: 1 } },
    })

    const streamUrl = video.videoKey
      ? await getSignedVideoUrl(video.videoKey, 7200)
      : video.videoUrl

    return NextResponse.json({
      success: true,
      canPlay: true,
      streamUrl,
      playCount: updated.playCount,
      limit,
      remaining: Math.max(0, limit - updated.playCount),
    })
  } catch (error) {
    console.error('Video play error:', error)
    return NextResponse.json({ error: 'Failed to process play request' }, { status: 500 })
  }
}