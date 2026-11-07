
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        isPublished: true,
        isArchived: false,
      },

      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
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
      }
    })

    return NextResponse.json(
      {
        success: true,
        quizzes: publicQuizzes,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
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
