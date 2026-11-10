
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

import {
  currentQuizTaker,
  validObjectId,
  publicQuestion,
} from '@/lib/quizAuth'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const { id } = await params
  const taker = await currentQuizTaker(req)

  if (!taker) {
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
        ...taker.owner,
      },
      include: {
        quiz: {
          select: {
            title: true,
            explanationVideoKey: true,
            explanationThumbnailKey: true,
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      )
    }

    if (attempt.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Exam still in progress' },
        { status: 403 }
      )
    }

    const submitted =
      attempt.status === 'SUBMITTED'

    const review = submitted
      ? attempt.snapshot.map(q => ({
          ...publicQuestion(q, id, attempt.id),
          correctIndex: q.correctIndex,
          chosenIndex:
            Object.prototype.hasOwnProperty.call(
              attempt.answers || {},
              q.id
            )
              ? attempt.answers[q.id]
              : null,

          explanation: q.explanation || '',
        }))
      : []

    return NextResponse.json(
      {
        success: true,
        quizTitle: attempt.quiz.title,
        status: attempt.status,
        endReason: attempt.endReason,
        score: attempt.score,
        maxScore: attempt.maxScore,

        hasExplanationVideo: Boolean(
          submitted &&
          attempt.quiz.explanationVideoKey
        ),

        hasExplanationThumbnail: Boolean(
          submitted &&
          attempt.quiz.explanationVideoKey &&
          attempt.quiz.explanationThumbnailKey
        ),

        review,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('Quiz result error:', error)

    return NextResponse.json(
      { error: 'Unable to load results' },
      { status: 500 }
    )
  }
}
