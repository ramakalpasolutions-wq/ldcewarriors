
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'

import {
  cleanQuestions,
  validObjectId,
} from '@/lib/quizAuth'

import {
  verifyQuizMedia,
  validQuizMediaKey,
} from '@/lib/quizMedia'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function badRequest(message) {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  )
}

function parseQuiz(body) {
  const title = String(body.title || '').trim()

  const mode =
    body.mode === 'MOCK' ? 'MOCK' : 'TOPIC'

  const topicId =
    mode === 'TOPIC' ? body.topicId || null : null

  const durationMinutes = Number(
    body.durationMinutes
  )

  const isPublished = Boolean(body.isPublished)

  if (!title || title.length > 160) {
    throw new Error('Enter a valid quiz title')
  }

  if (
    mode === 'TOPIC' &&
    !validObjectId(topicId)
  ) {
    throw new Error('Select an existing topic')
  }

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 240
  ) {
    throw new Error(
      'Duration must be between 1 and 240 minutes'
    )
  }

  const questions = cleanQuestions(
    body.questions || [],
    { allowEmpty: !isPublished }
  )

  // Explanation video stored in Cloudflare R2
  const explanationVideoKey = String(
    body.explanationVideoKey || ''
  ).trim()

  // Separate explanation thumbnail stored in R2
  const explanationThumbnailKey = String(
    body.explanationThumbnailKey || ''
  ).trim()

  if (
    explanationVideoKey &&
    !validQuizMediaKey(
      explanationVideoKey,
      'video'
    )
  ) {
    throw new Error('Invalid R2 explanation video')
  }

  if (
    explanationThumbnailKey &&
    !validQuizMediaKey(
      explanationThumbnailKey,
      'image'
    )
  ) {
    throw new Error(
      'Invalid explanation thumbnail image'
    )
  }

  if (
    isPublished &&
    !explanationVideoKey
  ) {
    throw new Error(
      'Upload an explanation video before publishing'
    )
  }

  return {
    title,

    description: String(
      body.description || ''
    ).trim().slice(0, 2000),

    mode,
    topicId,
    durationMinutes,

    accessType:
      body.accessType === 'PREMIUM'
        ? 'PREMIUM'
        : 'FREE',

    questions,

    explanationVideoKey:
      explanationVideoKey || null,

    explanationVideoName:
      String(
        body.explanationVideoName || ''
      ).trim().slice(0, 255) || null,

    explanationThumbnailKey:
      explanationThumbnailKey || null,

    isPublished,
  }
}

async function checkReferences(data) {
  // Verify selected existing topic
  if (data.topicId) {
    const topic = await prisma.topic.findFirst({
      where: {
        id: data.topicId,
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    if (!topic) {
      throw new Error('Topic not found')
    }
  }

  // Verify explanation video exists in R2
  if (data.explanationVideoKey) {
    await verifyQuizMedia(
      data.explanationVideoKey,
      'video'
    )
  }

  // Verify explanation thumbnail exists in R2
  if (data.explanationThumbnailKey) {
    await verifyQuizMedia(
      data.explanationThumbnailKey,
      'image'
    )
  }

  // Verify individual question images
  const imageKeys = [
    ...new Set(
      data.questions
        .map(question => question.imageKey)
        .filter(Boolean)
    ),
  ]

  for (const key of imageKeys) {
    await verifyQuizMedia(key, 'image')
  }
}

function handleError(error) {
  console.error('Quiz admin error:', error)

  const message = String(
    error?.message || ''
  )

  if (
    message.includes('Invalid') ||
    message.includes('Enter') ||
    message.includes('Select') ||
    message.includes('Duration') ||
    message.includes('Upload') ||
    message.includes('Questions') ||
    message.includes('Duplicate') ||
    message.includes('Topic not found') ||
    message.includes('question')
  ) {
    return badRequest(message)
  }

  if (error?.code === 'P2025') {
    return NextResponse.json(
      { error: 'Quiz not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    {
      error: 'Unable to process quiz request',
    },
    {
      status: 500,
    }
  )
}

// GET ALL QUIZZES FOR ADMIN
export async function GET(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        isArchived: false,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        topic: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        quizzes,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    return handleError(error)
  }
}

// CREATE NEW QUIZ
export async function POST(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const data = parseQuiz(
      await req.json()
    )

    // Verify all R2 media references
    await checkReferences(data)

    const quiz = await prisma.quiz.create({
      data,
    })

    return NextResponse.json(
      {
        success: true,
        quiz,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    return handleError(error)
  }
}

// UPDATE EXISTING QUIZ
export async function PUT(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()

    if (!validObjectId(body.id)) {
      return badRequest('Invalid quiz ID')
    }

    const data = parseQuiz(body)

    // Prevent editing while an active exam is running
    const activeAttempts =
      await prisma.quizAttempt.count({
        where: {
          quizId: body.id,
          status: 'IN_PROGRESS',
          expiresAt: {
            gt: new Date(),
          },
        },
      })

    if (activeAttempts > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot edit a quiz during active examinations',
        },
        {
          status: 409,
        }
      )
    }

    // Verify video, thumbnail and question images
    await checkReferences(data)

    const quiz = await prisma.quiz.update({
      where: {
        id: body.id,
      },
      data,
    })

    return NextResponse.json({
      success: true,
      quiz,
    })
  } catch (error) {
    return handleError(error)
  }
}

// ARCHIVE QUIZ
export async function DELETE(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const id = new URL(req.url)
    .searchParams.get('id')

  if (!validObjectId(id)) {
    return badRequest('Invalid quiz ID')
  }

  try {
    await prisma.quiz.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
        isPublished: false,
      },
    })

    await prisma.quizAttempt.updateMany({
      where: {
        quizId: id,
        status: 'IN_PROGRESS',
      },
      data: {
        status: 'TERMINATED',
        endReason: 'ARCHIVED',
        finishedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    return handleError(error)
  }
}
