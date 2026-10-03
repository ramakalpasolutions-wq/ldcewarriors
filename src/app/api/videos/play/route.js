import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { getSignedVideoUrl } from '@/lib/r2'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    /* ─────────────────────────────────────
       AUTHENTICATION
    ───────────────────────────────────── */

    const token =
      req.cookies.get('token')?.value ||
      req.cookies.get('adminToken')?.value ||
      req.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          canPlay: false,
          reason: 'unauthorized',
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const decoded = verifyToken(token)

    const userId =
      decoded?.userId ||
      decoded?.id ||
      decoded?.adminId

    if (!decoded || !userId) {
      return NextResponse.json(
        {
          success: false,
          canPlay: false,
          reason: 'invalid_token',
          error: 'Invalid token',
        },
        {
          status: 401,
        }
      )
    }

    /* ─────────────────────────────────────
       REQUEST
    ───────────────────────────────────── */

    const body = await req.json()

    const videoId = body?.videoId

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          canPlay: false,
          error: 'videoId required',
        },
        {
          status: 400,
        }
      )
    }

    /* ─────────────────────────────────────
       VIDEO
    ───────────────────────────────────── */

    const video = await prisma.video.findUnique({
      where: {
        id: videoId,
      },
    })

    if (!video || !video.isActive) {
      return NextResponse.json(
        {
          success: false,
          canPlay: false,
          reason: 'video_not_found',
          error: 'Video not found',
        },
        {
          status: 404,
        }
      )
    }

    const videoType =
      video.type?.toLowerCase()?.trim()

    const isFreeVideo =
      videoType === 'free'

    const isJoinFamily =
      videoType === 'join family' ||
      videoType === 'premium'

    /* ─────────────────────────────────────
       FREE VIDEO
    ───────────────────────────────────── */

    if (isFreeVideo) {
      await prisma.video.update({
        where: {
          id: videoId,
        },

        data: {
          views: {
            increment: 1,
          },
        },
      })

      const streamUrl = video.videoKey
        ? await getSignedVideoUrl(
            video.videoKey,
            3600
          )
        : video.videoUrl

      return NextResponse.json({
        success: true,
        canPlay: true,
        streamUrl,
        isFree: true,
      })
    }

    /* ─────────────────────────────────────
       USER
    ───────────────────────────────────── */

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        role: true,
        isActive: true,
        isPremium: true,
        premiumExpiresAt: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          canPlay: false,
          reason: 'account_inactive',
        },
        {
          status: 403,
        }
      )
    }

    /* ─────────────────────────────────────
       PREMIUM ACCESS
    ───────────────────────────────────── */

    const isAdmin =
      user.role?.toLowerCase() === 'admin'

    const premiumValid =
      user.isPremium === true &&
      (
        !user.premiumExpiresAt ||
        new Date(user.premiumExpiresAt) > new Date()
      )

    const hasPremiumAccess =
      isAdmin ||
      premiumValid

    if (isJoinFamily && !hasPremiumAccess) {
      return NextResponse.json(
        {
          success: false,
          canPlay: false,
          reason: 'no_subscription',
        },
        {
          status: 403,
        }
      )
    }

    /*
     * Any unknown/non-free video should NOT
     * accidentally become publicly playable.
     */

    if (!isJoinFamily && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          canPlay: false,
          reason: 'invalid_video_type',
          error: 'Unsupported video type',
        },
        {
          status: 400,
        }
      )
    }

    /* ─────────────────────────────────────
       PLAY LIMIT
    ───────────────────────────────────── */

    const limit =
      Number(video.playLimit) > 0
        ? Number(video.playLimit)
        : 3

    const now = new Date()

    let playRecord =
      await prisma.videoPlay.findUnique({
        where: {
          userId_videoId: {
            userId: user.id,
            videoId,
          },
        },
      })

    /* ─────────────────────────────────────
       FIRST PLAY
    ───────────────────────────────────── */

    if (!playRecord) {
      try {
        playRecord =
          await prisma.videoPlay.create({
            data: {
              userId: user.id,
              videoId,
              playCount: 1,
              lastPlayed: now,
            },
          })

        await prisma.video.update({
          where: {
            id: videoId,
          },

          data: {
            views: {
              increment: 1,
            },
          },
        })

        const streamUrl = video.videoKey
          ? await getSignedVideoUrl(
              video.videoKey,
              7200
            )
          : video.videoUrl

        return NextResponse.json({
          success: true,
          canPlay: true,

          streamUrl,

          playCount: 1,
          limit,
          remaining: Math.max(
            0,
            limit - 1
          ),
        })
      } catch (createError) {
        /*
         * Handles two simultaneous requests trying
         * to create the same unique VideoPlay.
         */

        playRecord =
          await prisma.videoPlay.findUnique({
            where: {
              userId_videoId: {
                userId: user.id,
                videoId,
              },
            },
          })

        if (!playRecord) {
          throw createError
        }
      }
    }

    /* ─────────────────────────────────────
       DOUBLE CLICK / DUPLICATE REQUEST GUARD
    ───────────────────────────────────── */

    const lastPlayedTime =
      new Date(playRecord.lastPlayed).getTime()

    const timeSinceLastPlay =
      now.getTime() - lastPlayedTime

    /*
     * IMPORTANT:
     *
     * Opening the same video again within
     * 15 seconds does NOT consume another play.
     */

    if (
      playRecord.playCount > 0 &&
      timeSinceLastPlay >= 0 &&
      timeSinceLastPlay < 15000
    ) {
      const streamUrl = video.videoKey
        ? await getSignedVideoUrl(
            video.videoKey,
            7200
          )
        : video.videoUrl

      return NextResponse.json({
        success: true,
        canPlay: true,

        streamUrl,

        playCount:
          playRecord.playCount,

        limit,

        remaining:
          Math.max(
            0,
            limit - playRecord.playCount
          ),

        duplicateRequest: true,
      })
    }

    /* ─────────────────────────────────────
       LIMIT ALREADY REACHED
    ───────────────────────────────────── */

    if (
      playRecord.playCount >= limit
    ) {
      return NextResponse.json(
        {
          success: false,
          canPlay: false,

          reason:
            'play_limit_exceeded',

          playCount:
            playRecord.playCount,

          limit,

          remaining: 0,
        },
        {
          status: 403,
        }
      )
    }

    /* ─────────────────────────────────────
       CONSUME EXACTLY ONE PLAY
    ───────────────────────────────────── */

    const updated =
      await prisma.videoPlay.update({
        where: {
          id: playRecord.id,
        },

        data: {
          playCount: {
            increment: 1,
          },

          lastPlayed: now,
        },
      })

    await prisma.video.update({
      where: {
        id: videoId,
      },

      data: {
        views: {
          increment: 1,
        },
      },
    })

    const streamUrl = video.videoKey
      ? await getSignedVideoUrl(
          video.videoKey,
          7200
        )
      : video.videoUrl

    const remaining =
      Math.max(
        0,
        limit - updated.playCount
      )

    return NextResponse.json({
      success: true,
      canPlay: true,

      streamUrl,

      playCount:
        updated.playCount,

      limit,

      remaining,
    })
  } catch (error) {
    console.error(
      'Video play error:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        canPlay: false,
        error:
          'Failed to process play request',
      },
      {
        status: 500,
      }
    )
  }
}