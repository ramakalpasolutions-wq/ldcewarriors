
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import {
  currentQuizTaker,
  validObjectId,
  validatedAnswers,
} from '@/lib/quizAuth'

export async function POST(req, { params }) {
  const { id } = await params
  const taker = await currentQuizTaker(req)

  if (!taker) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { attemptId, answers } = await req.json()

    if (
      !validObjectId(id) ||
      !validObjectId(attemptId)
    ) {
      return NextResponse.json(
        { error: 'Invalid attempt' },
        { status: 400 }
      )
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        quizId: id,
        ...taker.owner,
      },
    })

    if (
      !attempt ||
      attempt.status !== 'IN_PROGRESS' ||
      new Date(attempt.expiresAt) <= new Date()
    ) {
      return NextResponse.json(
        { error: 'Attempt ended or expired' },
        { status: 409 }
      )
    }

    const valid = validatedAnswers(
      attempt.snapshot,
      answers
    )

    const result = await prisma.quizAttempt.updateMany({
      where: {
        id: attemptId,
        ...taker.owner,
        status: 'IN_PROGRESS',
        expiresAt: { gt: new Date() },
      },
      data: {
        answers: valid,
        lastSeenAt: new Date(),
      },
    })

    if (!result.count) {
      return NextResponse.json(
        { error: 'Attempt ended' },
        { status: 409 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save quiz error:', error)

    return NextResponse.json(
      { error: 'Unable to save answers' },
      { status: 500 }
    )
  }
}
