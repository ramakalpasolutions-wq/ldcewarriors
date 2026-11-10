
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import {
  currentQuizUser,
  hasPremiumAccess,
} from '@/lib/quizAuth'

export const dynamic = 'force-dynamic'

// Quizzes with an order number come first (1, 2, 3…),
// the rest follow in the order they were created.
function byOrder(a, b) {
  const ao = a.order ?? Infinity
  const bo = b.order ?? Infinity
  if (ao !== bo) return ao - bo
  return new Date(a.createdAt) - new Date(b.createdAt)
}

export async function GET(req) {
  try {
    const user = await currentQuizUser(req)
    const hasFamily = hasPremiumAccess(user)

    const quizzes = await prisma.quiz.findMany({
      where: {
        isPublished: true,
        isArchived: false,
      },

      select: {
        id: true,
        order: true,
        createdAt: true,
        title: true,
        description: true,
        mode: true,
        topicId: true,
        durationMinutes: true,
        accessType: true,
        questions: true,

        topic: {
          select: {
            name: true,
            thumbnail: true,
          },
        },
      },
    })

    const publicQuizzes = quizzes.map(quiz => {
      const questions = Array.isArray(quiz.questions)
        ? quiz.questions
        : []

      const totalMarks = questions.reduce(
        (sum, question) => {
          const marks = Number(question.marks)

          return sum + (
            Number.isFinite(marks) && marks > 0
              ? marks
              : 1
          )
        },
        0
      )

      // Never expose correct answers in listing APIs.
      const { questions: _questions, ...publicQuiz } = quiz

      return {
        ...publicQuiz,
        questionCount: questions.length,
        totalMarks,
        // Premium quizzes are locked unless the user is an active family member
        locked: quiz.accessType === 'PREMIUM' && !hasFamily,
      }
    }).sort(byOrder)

    return NextResponse.json(
      {
        success: true,
        quizzes: publicQuizzes,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    )
  } catch (error) {
    console.error('Public quizzes API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to load quizzes',
      },
      {
        status: 500,
      }
    )
  }
}
