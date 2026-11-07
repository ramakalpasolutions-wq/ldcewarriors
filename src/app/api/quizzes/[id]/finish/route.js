
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

import {
  currentQuizUser,
  validObjectId,
  validatedAnswers,
  calculateScore,
} from '@/lib/quizAuth'

const violations = [
  'TAB_HIDDEN',
  'WINDOW_BLUR',
  'PAGE_EXIT',
  'FULLSCREEN_EXIT',
]

export async function POST(req, { params }) {
  const { id } = await params
  const user = await currentQuizUser(req)

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()

    if (
      !validObjectId(id) ||
      !validObjectId(body.attemptId)
    ) {
      return NextResponse.json(
        { error: 'Invalid attempt' },
        { status: 400 }
      )
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: body.attemptId,
        quizId: id,
        userId: user.id,
      },
    })

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      )
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({
        success: true,
        attemptId: attempt.id,
        status: attempt.status,
      })
    }

    const violation = violations.includes(
      body.reason
    )

    const expired =
      new Date(attempt.expiresAt) <= new Date()

    const status = violation
      ? 'TERMINATED'
      : 'SUBMITTED'

    const reason = violation
      ? body.reason
      : expired
        ? 'TIME_LIMIT'
        : 'USER_SUBMITTED'

    const answers = {
      ...attempt.answers,
      ...validatedAnswers(
        attempt.snapshot,
        body.answers
      ),
    }

    const { score, maxScore } = calculateScore(
      attempt.snapshot,
      answers
    )

    const updated = await prisma.quizAttempt.updateMany({
      where: {
        id: attempt.id,
        status: 'IN_PROGRESS',
      },
      data: {
        answers,
        score,
        maxScore,
        status,
        endReason: reason,
        finishedAt: new Date(),
      },
    })

    if (!updated.count) {
      const latest = await prisma.quizAttempt.findUnique({
        where: { id: attempt.id },
        select: { status: true },
      })

      return NextResponse.json({
        success: true,
        attemptId: attempt.id,
        status: latest?.status || 'TERMINATED',
      })
    }

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      status,
      reason,
    })
  } catch (error) {
    console.error('Finish exam error:', error)

    return NextResponse.json(
      { error: 'Unable to finish exam' },
      { status: 500 }
    )
  }
}
