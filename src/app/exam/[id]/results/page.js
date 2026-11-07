
'use client'

import {
  useEffect,
  useState,
} from 'react'

import { useParams } from 'next/navigation'
import Link from 'next/link'

const navy = '#1B2A4A'

export default function QuizResultsPage() {
  const { id } = useParams()

  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const attemptId = new URLSearchParams(
      window.location.search
    ).get('attemptId')

    if (!attemptId) {
      setError('Missing attempt ID')
      return
    }

    let cancelled = false
    let retryTimer
    let retries = 3

    async function loadResult() {
      try {
        const response = await fetch(
          `/api/quizzes/${id}/result?attemptId=${encodeURIComponent(attemptId)}`,
          { cache: 'no-store' }
        )

        const data = await response.json()

        if (cancelled) return

        if (!response.ok) {
          if (
            data.error === 'Exam still in progress' &&
            retries-- > 0
          ) {
            retryTimer = setTimeout(
              loadResult,
              1000
            )
            return
          }

          throw new Error(
            data.error || 'Unable to load result'
          )
        }

        setResult(data)
      } catch (error) {
        if (!cancelled) {
          setError(error.message)
        }
      }
    }

    loadResult()

    return () => {
      cancelled = true
      clearTimeout(retryTimer)
    }
  }, [id])

  return (
    <main style={{
      background: '#F5F3EF',
      minHeight: '100vh',
      padding: '50px 18px',
      color: navy,
    }}>
      <div style={{
        maxWidth: 950,
        margin: '0 auto',
      }}>
        <h1 style={{
          fontFamily: 'Playfair Display,serif',
          fontSize: 34,
          marginBottom: 25,
        }}>
          Examination Results
        </h1>

        {error && (
          <p style={{ color: '#B42318' }}>
            {error}
          </p>
        )}

        {!result && !error && (
          <p>Loading results...</p>
        )}

        {result && (
          <>
            <section style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 18,
              padding: 30,
              marginBottom: 25,
            }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 800,
              }}>
                {result.quizTitle}
              </h2>

              <p style={{
                color:
                  result.status === 'SUBMITTED'
                    ? '#21867A'
                    : '#B42318',
                fontWeight: 800,
                margin: '15px 0',
              }}>
                {result.status === 'SUBMITTED'
                  ? 'Successfully Submitted'
                  : 'Exam Terminated'}
              </p>

              {result.endReason &&
                result.status !== 'SUBMITTED' && (
                  <p style={{
                    color: '#B42318',
                    marginBottom: 12,
                  }}>
                    Reason: {result.endReason}
                  </p>
                )}

              <div style={{
                fontSize: 38,
                fontWeight: 900,
              }}>
                {result.score ?? 0}

                <span style={{
                  fontSize: 18,
                  color: '#6B7280',
                }}>
                  {' '}/ {result.maxScore ?? '—'}
                  {' '}Marks
                </span>
              </div>

              {result.maxScore > 0 && (
                <p style={{
                  color: '#6B7280',
                  marginTop: 8,
                }}>
                  Percentage:{' '}
                  {(
                    ((result.score || 0) /
                      result.maxScore) *
                    100
                  ).toFixed(2)}%
                </p>
              )}
            </section>

            {result.review?.map((q, index) => {
              const correct =
                q.chosenIndex === q.correctIndex

              return (
                <article
                  key={q.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 15,
                  }}
                >
                  <h3 style={{
                    fontSize: 18,
                    lineHeight: 1.6,
                    marginBottom: 15,
                  }}>
                    {index + 1}. {q.text}
                  </h3>

                  {q.imageUrl && (
                    <img
                      src={q.imageUrl}
                      alt={`Question ${index + 1}`}
                      style={{
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: 350,
                        objectFit: 'contain',
                        borderRadius: 12,
                        marginBottom: 18,
                      }}
                    />
                  )}

                  <p style={{
                    color: correct
                      ? '#21867A'
                      : '#B42318',
                    fontWeight: 700,
                  }}>
                    Your Answer:{' '}

                    {q.chosenIndex == null
                      ? 'Not Answered'
                      : q.options[q.chosenIndex]}
                  </p>

                  <p style={{
                    color: '#21867A',
                    marginTop: 10,
                  }}>
                    Correct Answer:{' '}
                    {q.options[q.correctIndex]}
                  </p>

                  {q.explanation && (
                    <div style={{
                      padding: 15,
                      background: '#F5F3EF',
                      borderRadius: 10,
                      marginTop: 18,
                      lineHeight: 1.7,
                    }}>
                      <strong>Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </article>
              )
            })}

            <div style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 25,
            }}>
              <Link
                href="/quiz"
                className="btn-primary"
                style={{ textDecoration: 'none' }}
              >
                Topic Quizzes
              </Link>

              <Link
                href="/mock-tests"
                className="btn-gold"
                style={{ textDecoration: 'none' }}
              >
                Full Mock Tests
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
