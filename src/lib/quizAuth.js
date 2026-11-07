
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/db'

import { validQuizMediaKey } from '@/lib/quizMedia'

export function validObjectId(id) {
  return (
    typeof id === 'string' &&
    /^[a-f0-9]{24}$/i.test(id)
  )
}

export async function currentQuizUser(req) {
  try {
    const token = req.cookies.get('token')?.value
    const decoded = token ? verifyToken(token) : null

    const id = decoded?.userId || decoded?.id

    if (!validObjectId(id)) return null

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
        isPremium: true,
        premiumExpiresAt: true,
      },
    })

    return user?.isActive ? user : null
  } catch {
    return null
  }
}

export function hasPremiumAccess(user) {
  return Boolean(
    user?.isPremium &&
    (
      !user.premiumExpiresAt ||
      new Date(user.premiumExpiresAt) > new Date()
    )
  )
}

export function cleanQuestions(
  questions,
  { allowEmpty = true } = {}
) {
  if (
    !Array.isArray(questions) ||
    questions.length > 200 ||
    (!allowEmpty && questions.length === 0)
  ) {
    throw new Error(
      'Questions must contain 1 to 200 items'
    )
  }

  const ids = new Set()

  return questions.map((q, index) => {
    const id = String(
      q.id || `q-${index + 1}`
    ).slice(0, 80)

    if (ids.has(id)) {
      throw new Error('Duplicate question ID')
    }

    ids.add(id)

    const text = String(q.text || '').trim()
    const options = q.options
    const correctIndex = Number(q.correctIndex)
    const marks = Number(q.marks)
    const imageKey = String(q.imageKey || '').trim()

    if (
      !text ||
      text.length > 2500 ||
      !Array.isArray(options) ||
      options.length !== 4 ||
      options.some(
        option =>
          typeof option !== 'string' ||
          !option.trim() ||
          option.length > 500
      ) ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex > 3 ||
      !Number.isInteger(marks) ||
      marks < 1 ||
      marks > 20
    ) {
      throw new Error(
        `Invalid question ${index + 1}`
      )
    }

    if (
      imageKey &&
      !validQuizMediaKey(imageKey, 'image')
    ) {
      throw new Error(
        `Invalid image for question ${index + 1}`
      )
    }

    return {
      id,
      text,
      imageKey: imageKey || null,
      options: options.map(option => option.trim()),
      correctIndex,
      marks,
      explanation: String(
        q.explanation || ''
      ).trim().slice(0, 2000),
    }
  })
}

export function publicQuestion(q, quizId, attemptId) {
  return {
    id: q.id,
    text: q.text,
    options: q.options,
    marks: q.marks || 1,

    imageUrl: q.imageKey
      ? `/api/quizzes/${quizId}/question-image?attemptId=${encodeURIComponent(attemptId)}&questionId=${encodeURIComponent(q.id)}`
      : null,
  }
}

export function validatedAnswers(snapshot, incoming) {
  const allowed = new Map(
    snapshot.map(q => [q.id, q.options.length])
  )

  const result = {}

  if (
    !incoming ||
    typeof incoming !== 'object' ||
    Array.isArray(incoming)
  ) {
    return result
  }

  for (const [id, value] of Object.entries(incoming)) {
    if (
      allowed.has(id) &&
      Number.isInteger(value) &&
      value >= 0 &&
      value < allowed.get(id)
    ) {
      result[id] = value
    }
  }

  return result
}

export function calculateScore(questions, answers) {
  let score = 0
  let maxScore = 0

  for (const q of questions) {
    maxScore += q.marks || 1

    if (
      Object.prototype.hasOwnProperty.call(
        answers,
        q.id
      ) &&
      answers[q.id] === q.correctIndex
    ) {
      score += q.marks || 1
    }
  }

  return { score, maxScore }
}
