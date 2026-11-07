
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

export default function QuizCatalog({ mode = 'TOPIC' }) {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [error, setError] = useState('')

  const isMock = mode === 'MOCK'

  useEffect(() => {
    fetch('/api/quizzes')
      .then(async response => {
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Unable to load tests')
        }
        return data
      })
      .then(data => setQuizzes(data.quizzes || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const list = useMemo(
    () => quizzes.filter(q => q.mode === mode),
    [quizzes, mode]
  )

  const topics = useMemo(
    () => [
      ...new Map(
        list
          .filter(q => q.topicId)
          .map(q => [
            q.topicId,
            {
              id: q.topicId,
              name: q.topic?.name || 'Topic',
            },
          ])
      ).values(),
    ],
    [list]
  )

  const visible = isMock || selectedTopic === 'all'
    ? list
    : list.filter(q => q.topicId === selectedTopic)

  return (
    <main style={{
      minHeight: '100vh',
      padding: '125px 20px 70px',
      background: '#F5F3EF',
    }}>
      <div style={{ maxWidth: 1250, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}>
          <div>
            <span style={{
              color: '#D4922A',
              fontWeight: 800,
              letterSpacing: 2,
            }}>
              LDCE WARRIORS
            </span>

            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(30px, 5vw, 44px)',
              color: '#1B2A4A',
              margin: '12px 0',
            }}>
              {isMock ? 'Full Mock Tests' : 'Test Yourself'}
            </h1>

            <p style={{ color: '#6B7280' }}>
              {isMock
                ? 'Choose a mock test and begin your timed examination.'
                : 'Choose a topic and test your LDCE knowledge.'}
            </p>
          </div>

          <Link
            href={isMock ? '/quiz' : '/mock-tests'}
            className="btn-gold"
            style={{ textDecoration: 'none' }}
          >
            {isMock ? 'Topic Quizzes' : 'Full Mock Tests'} →
          </Link>
        </div>

        {!isMock && topics.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            margin: '28px 0',
          }}>
            {[
              { id: 'all', name: 'All Topics' },
              ...topics,
            ].map(topic => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                style={{
                  background:
                    selectedTopic === topic.id
                      ? '#1B2A4A'
                      : '#FFFFFF',
                  color:
                    selectedTopic === topic.id
                      ? '#FFFFFF'
                      : '#1B2A4A',
                  border: '1px solid #E5E7EB',
                  borderRadius: 30,
                  padding: '11px 18px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {topic.name}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p style={{ marginTop: 30 }}>Loading quizzes...</p>
        )}

        {error && (
          <p style={{
            marginTop: 25,
            color: '#B42318',
          }}>
            {error}
          </p>
        )}

        {!loading && !error && visible.length === 0 && (
          <div style={{
            padding: 35,
            background: '#FFFFFF',
            borderRadius: 16,
            marginTop: 30,
          }}>
            <h2 style={{ color: '#1B2A4A' }}>
              Tests Coming Soon
            </h2>
            <p style={{ color: '#6B7280' }}>
              Published quizzes will appear here.
            </p>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(275px, 1fr))',
          gap: 20,
          marginTop: 30,
        }}>
          {visible.map(quiz => (
            <article
              key={quiz.id}
              style={{
                padding: 24,
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 18,
              }}
            >
              <span style={{
                color: '#2A9D8F',
                fontSize: 12,
                fontWeight: 800,
              }}>
                {isMock
                  ? 'MOCK EXAM'
                  : quiz.topic?.name || 'TOPIC QUIZ'}
              </span>

              <h2 style={{
                fontFamily: 'Playfair Display, serif',
                color: '#1B2A4A',
                fontSize: 23,
                margin: '12px 0',
              }}>
                {quiz.title}
              </h2>

              <p style={{
                color: '#6B7280',
                fontSize: 14,
                minHeight: 40,
              }}>
                {quiz.description ||
                  'Test your LDCE preparation.'}
              </p>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                margin: '18px 0',
              }}>
                {[
                  `${quiz.questionCount} Questions`,
                  `${quiz.durationMinutes} Minutes`,
                  quiz.accessType === 'PREMIUM'
                    ? 'Join Family'
                    : 'Free',
                ].map(label => (
                  <span
                    key={label}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: '#F5F3EF',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <Link
                href={`/exam/${quiz.id}`}
                style={{
                  display: 'block',
                  background: '#1B2A4A',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  padding: 14,
                  borderRadius: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                Start Quiz →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
