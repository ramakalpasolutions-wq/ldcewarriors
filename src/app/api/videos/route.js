import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)

    const type = searchParams.get('type')
    const topicId = searchParams.get('topicId')
    const homepage = searchParams.get('homepage')

    const parsedLimit = parseInt(searchParams.get('limit') || '20', 10)
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 20

    const where = {
      isActive: true,
    }

    if (type) {
      where.type = type
    }

    if (topicId) {
      where.topicId = topicId
    }

    if (homepage === 'true') {
      where.showOnHomepage = true
    }

    /* ─────────────────────────────────────
       CHECK CURRENT USER ACCESS
    ───────────────────────────────────── */

    const token =
      req.cookies.get('token')?.value ||
      req.cookies.get('adminToken')?.value ||
      req.cookies.get('admin_token')?.value

    let currentUser = null
    let hasPremiumAccess = false
    let playCounts = {}

    if (token) {
      const decoded = verifyToken(token)

      const userId =
        decoded?.userId ||
        decoded?.id ||
        decoded?.adminId

      if (userId) {
        currentUser = await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            role: true,
            isActive: true,
            isPremium: true,
            premiumExpiresAt: true,

            videoPlays: {
              select: {
                videoId: true,
                playCount: true,
              },
            },
          },
        })

        if (currentUser?.isActive) {
          const isAdmin =
            currentUser.role?.toLowerCase() === 'admin'

          const premiumIsValid =
            currentUser.isPremium === true &&
            (
              !currentUser.premiumExpiresAt ||
              new Date(currentUser.premiumExpiresAt) > new Date()
            )

          hasPremiumAccess =
            isAdmin ||
            premiumIsValid

          playCounts = Object.fromEntries(
            (currentUser.videoPlays || []).map((play) => [
              play.videoId,
              play.playCount,
            ])
          )
        }
      }
    }

    /* ─────────────────────────────────────
       FETCH VIDEOS
    ───────────────────────────────────── */

    const videos = await prisma.video.findMany({
      where,

      include: {
        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },

      orderBy: [
        {
          order: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],

      take: limit,
    })

    /* ─────────────────────────────────────
       PROCESS VIDEOS
    ───────────────────────────────────── */

    const processedVideos = videos.map((video) => {
      const videoId = video.id

      const usedPlays =
        playCounts[videoId] || 0

      const playLimit =
        video.playLimit || 3

      const remainingPlays =
        Math.max(0, playLimit - usedPlays)

      const isJoinFamily =
        video.type?.toLowerCase() === 'join family' ||
        video.type?.toLowerCase() === 'premium'

      const accessLocked =
        isJoinFamily &&
        !hasPremiumAccess

      const limitLocked =
        isJoinFamily &&
        hasPremiumAccess &&
        usedPlays >= playLimit

      return {
        ...video,

        _id: video.id,

        topicId: video.topic
          ? {
              _id: video.topicId,
              name: video.topic.name,
              slug: video.topic.slug,
            }
          : null,

        // Never expose R2 key publicly
        videoKey: undefined,

        // Never expose premium URL directly.
        // User must request /api/videos/play
        videoUrl: isJoinFamily
          ? null
          : video.videoUrl,

        playCount: usedPlays,

        remainingPlays,

        isLocked:
          accessLocked ||
          limitLocked,

        lockReason: accessLocked
          ? 'no_subscription'
          : limitLocked
            ? 'play_limit_exceeded'
            : null,
      }
    })

    return NextResponse.json(
      {
        success: true,

        videos: processedVideos,

        access: {
          isLoggedIn: Boolean(currentUser),
          isPremium: hasPremiumAccess,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Videos GET error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch videos',
      },
      {
        status: 500,
      }
    )
  }
}