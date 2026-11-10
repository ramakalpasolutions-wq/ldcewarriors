
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

import {
  currentQuizUser,
  GUEST_COOKIE,
  newGuestId,
  setGuestCookie,
  validGuestId,
  hasPremiumAccess,
  validObjectId,
  publicQuestion,
} from '@/lib/quizAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req, { params }) {
  const { id } = await params

  // Validate quiz ID
  if (!validObjectId(id)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid quiz ID',
      },
      {
        status: 400,
      }
    )
  }

  // Signed-in student (needed for Family tests). Free tests also allow guests.
  const user = await currentQuizUser(req)

  try {
    // Load published quiz
    const quiz = await prisma.quiz.findFirst({
      where: {
        id,
        isPublished: true,
        isArchived: false,
      },
    })

    if (!quiz) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quiz not available',
        },
        {
          status: 404,
        }
      )
    }

    // Family (Premium) tests: must be signed in…
    if (quiz.accessType === 'PREMIUM' && !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please sign in to take this test',
          loginRequired: true,
        },
        {
          status: 401,
        }
      )
    }

    // …and have an active Join Family membership.
    // Free tests: anyone, signed in or not.
    if (
      quiz.accessType === 'PREMIUM' &&
      !hasPremiumAccess(user)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Active Join Family membership is required',
          redirectTo: '/join-family',
        },
        {
          status: 403,
        }
      )
    }

    const snapshot = Array.isArray(quiz.questions)
      ? quiz.questions
      : []

    if (snapshot.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No questions available',
        },
        {
          status: 400,
        }
      )
    }

    // Who owns this attempt: the student, or a guest id for free tests
    const existingGuest = req.cookies.get(GUEST_COOKIE)?.value
    const guestId = user
      ? null
      : validGuestId(existingGuest) ? existingGuest : newGuestId()
    const owner = user ? { userId: user.id } : { guestId }

    // End any older unfinished attempt
    await prisma.quizAttempt.updateMany({
      where: {
        ...owner,
        quizId: id,
        status: 'IN_PROGRESS',
      },
      data: {
        status: 'TERMINATED',
        endReason: 'RESTART_OR_ABANDONED',
        finishedAt: new Date(),
      },
    })

    // Set examination start and expiry
    const startedAt = new Date()

    const expiresAt = new Date(
      startedAt.getTime() +
      quiz.durationMinutes * 60 * 1000
    )

    // Create a new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        ...owner,
        quizId: quiz.id,

        snapshot,
        answers: {},

        status: 'IN_PROGRESS',

        startedAt,
        expiresAt,
        lastSeenAt: startedAt,
      },
    })

    // Check whether explanation video exists
    const hasExplanationVideo = Boolean(
      quiz.explanationVideoKey
    )

    // Generate student thumbnail endpoint URL.
    // Do not expose the underlying R2 object key.
    // Do not send the actual video URL.
    const explanationThumbnailUrl =
      hasExplanationVideo &&
      quiz.explanationThumbnailKey
        ? `/api/quizzes/${quiz.id}/explanation-thumbnail?attemptId=${attempt.id}`
        : null

    const response = NextResponse.json(
      {
        success: true,

        attemptId: attempt.id,
        quizId: quiz.id,

        title: quiz.title,
        durationMinutes: quiz.durationMinutes,

        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),

        // Controls the sidebar video preview
        hasExplanationVideo,
        explanationThumbnailUrl,

        // No correct answers returned to students
        questions: snapshot.map(question =>
          publicQuestion(
            question,
            quiz.id,
            attempt.id
          )
        ),
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )

    // Remember the guest so they can save, submit and see their own results
    if (guestId) setGuestCookie(response, guestId)

    return response
  } catch (error) {
    console.error('Start quiz error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to start examination',
      },
      {
        status: 500,
      }
    )
  }
}
