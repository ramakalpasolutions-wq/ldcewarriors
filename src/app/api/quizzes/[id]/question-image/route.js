
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

import {
  currentQuizTaker,
  validObjectId,
} from '@/lib/quizAuth'

import { signedQuizMediaUrl } from '@/lib/quizMedia'

export const runtime = 'nodejs'
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

  const url = new URL(req.url)

  const attemptId =
    url.searchParams.get('attemptId')

  const questionId =
    url.searchParams.get('questionId')

  if (
    !validObjectId(id) ||
    !validObjectId(attemptId) ||
    !questionId
  ) {
    return NextResponse.json(
      { error: 'Invalid request' },
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
      select: {
        status: true,
        expiresAt: true,
        snapshot: true,
      },
    })

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      )
    }

    const canView =
      attempt.status === 'SUBMITTED' ||
      (
        attempt.status === 'IN_PROGRESS' &&
        new Date(attempt.expiresAt) > new Date()
      )

    if (!canView) {
      return NextResponse.json(
        { error: 'Image access unavailable' },
        { status: 403 }
      )
    }

    const question = attempt.snapshot.find(
      q => q.id === questionId
    )

    if (!question?.imageKey) {
      return NextResponse.json(
        { error: 'Question image not found' },
        { status: 404 }
      )
    }

    const signedUrl = await signedQuizMediaUrl(
      question.imageKey,
      'image',
      300
    )

    return NextResponse.redirect(signedUrl, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Question image error:', error)

    return NextResponse.json(
      { error: 'Unable to load question image' },
      { status: 500 }
    )
  }
}
