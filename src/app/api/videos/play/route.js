import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { getSignedVideoUrl } from '@/lib/r2'

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

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
      where: { id: decoded.userId },
      select: { id: true, isPremium: true, premiumExpiresAt: true, isActive: true }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        canPlay: false,
        reason: 'account_inactive',
      })
    }

    const isSubscribed = Boolean(
      user.isPremium &&
      (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date())
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

    // 1. Fetch play record
    let playRecord = await prisma.videoPlay.findUnique({
      where: { userId_videoId: { userId: user.id, videoId } },
    })

    // 🌟 2. ATOMIC FIRST-TIME PLAY CREATION
    // Creating directly with playCount: 1 and lastPlayed: now prevents race-condition double logs!
    if (!playRecord) {
      try {
        playRecord = await prisma.videoPlay.create({
          data: { 
            userId: user.id, 
            videoId, 
            playCount: 1, 
            lastPlayed: now 
          },
        })

        // Increment global video views
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
        // Fallback if another concurrent request created it first
        playRecord = await prisma.videoPlay.findUnique({
          where: { userId_videoId: { userId: user.id, videoId } },
        })
        if (!playRecord) throw err
      }
    }

    // 🌟 3. TEN-SECOND SAFETY WINDOW (Debounce)
    // If played within last 10s, return stream immediately without incrementing playCount
    const timeSinceLastPlay = now.getTime() - new Date(playRecord.lastPlayed).getTime()
    if (timeSinceLastPlay < 10000 && playRecord.playCount > 0) {
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
    }

    // 4. Check play limit
    if (playRecord.playCount >= limit) {
      return NextResponse.json({
        success: false,
        canPlay: false,
        reason: 'play_limit_exceeded',
        playCount: playRecord.playCount,
        limit,
      })
    }

    // 🌟 5. RACE-CONDITION OPTIMISTIC UPDATE
    const updateResult = await prisma.videoPlay.updateMany({
      where: { 
        id: playRecord.id,
        playCount: playRecord.playCount
      },
      data: { 
        playCount: { increment: 1 }, 
        lastPlayed: now 
      },
    })

    let finalPlayCount = playRecord.playCount
    if (updateResult.count === 0) {
      // Parallel request updated it first; fetch the newly written count
      const freshRecord = await prisma.videoPlay.findUnique({ where: { id: playRecord.id } })
      finalPlayCount = freshRecord ? freshRecord.playCount : playRecord.playCount + 1
    } else {
      finalPlayCount += 1
    }

    // 6. Increment global video views
    await prisma.video.update({
      where: { id: videoId },
      data: { views: { increment: 1 } },
    })

    // 7. Generate signed URL (2 hours)
    const streamUrl = video.videoKey
      ? await getSignedVideoUrl(video.videoKey, 7200)
      : video.videoUrl

    return NextResponse.json({
      success: true,
      canPlay: true,
      streamUrl,
      playCount: finalPlayCount,
      limit,
      remaining: limit - finalPlayCount,
    })
  } catch (error) {
    console.error('Video play error:', error)
    return NextResponse.json({ error: 'Failed to process play request' }, { status: 500 })
  }
}