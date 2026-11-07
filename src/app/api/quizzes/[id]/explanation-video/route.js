
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

import {
  currentQuizUser,
  validObjectId,
} from '@/lib/quizAuth'

import { signedQuizMediaUrl } from '@/lib/quizMedia'

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
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        quizId: id,
        userId: user.id,
        status: 'SUBMITTED',
      },
      include: {
        quiz: {
          select: {
            explanationVideoKey: true,
          },
        },
      },
    })

    if (!attempt?.quiz?.explanationVideoKey) {
      return NextResponse.json(
        { error: 'Explanation video not available' },
        { status: 404 }
      )
    }

    const streamUrl = await signedQuizMediaUrl(
      attempt.quiz.explanationVideoKey,
      'video',
      7200
    )

    return NextResponse.json(
      {
        success: true,
        streamUrl,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('Explanation video error:', error)

    return NextResponse.json(
      { error: 'Unable to load explanation video' },
      { status: 500 }
    )
  }
}
