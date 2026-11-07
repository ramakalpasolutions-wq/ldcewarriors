
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

import {
  currentQuizUser,
  validObjectId,
} from '@/lib/quizAuth'

import {
  signedQuizMediaUrl,
} from '@/lib/quizMedia'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const { id } = await params

  const user = await currentQuizUser(req)

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const attemptId = new URL(req.url)
    .searchParams.get('attemptId')

  if (
    !validObjectId(id) ||
    !validObjectId(attemptId)
  ) {
    return NextResponse.json(
      { error: 'Invalid attempt' },
      { status: 400 }
    )
  }

  try {
    const attempt =
      await prisma.quizAttempt.findFirst({
        where: {
          id: attemptId,
          quizId: id,
          userId: user.id,
          status: 'IN_PROGRESS',
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          quiz: {
            select: {
              explanationThumbnailKey: true,
              explanationVideoKey: true,
            },
          },
        },
      })

    if (!attempt) {
      return NextResponse.json(
        { error: 'Active attempt not found' },
        { status: 403 }
      )
    }

    const key =
      attempt.quiz?.explanationThumbnailKey

    if (
      !attempt.quiz?.explanationVideoKey ||
      !key
    ) {
      return NextResponse.json(
        { error: 'Thumbnail not available' },
        { status: 404 }
      )
    }

    const url = await signedQuizMediaUrl(
      key,
      'image',
      300
    )

    return NextResponse.redirect(url, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error(
      'Explanation thumbnail error:',
      error
    )

    return NextResponse.json(
      { error: 'Unable to load thumbnail' },
      { status: 500 }
    )
  }
}
