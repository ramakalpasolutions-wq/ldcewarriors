
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const colors = {
  navy: '#1B2A4A',
  gold: '#E8A838',
  bg: '#F5F3EF',
  muted: '#6B7280',
  border: '#E5E7EB',
}

export default function QuizPage() {
  const [topics, setTopics] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadTopics() {
      try {
        const [topicRes, quizRes] = await Promise.all([
          fetch('/api/admin/topics'),
          fetch('/api/quizzes'),
        ])

        const [topicData, quizData] = await Promise.all([
          topicRes.json(),
          quizRes.json(),
        ])

        if (!topicRes.ok || !topicData.success) {
          throw new Error('Unable to load topics')
        }

        if (!quizRes.ok || !quizData.success) {
          throw new Error('Unable to load quizzes')
        }

        const quizCounts = {}

        for (const quiz of quizData.quizzes || []) {
          if (quiz.mode === 'TOPIC' && quiz.topicId) {
            quizCounts[quiz.topicId] =
              (quizCounts[quiz.topicId] || 0) + 1
          }
        }

        if (!cancelled) {
          setTopics(topicData.topics || [])
          setCounts(quizCounts)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTopics()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: '100vh',
          background: colors.bg,
          padding: '120px 20px 85px',
        }}
      >
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 42 }}>
            <span
              style={{
                color: '#D4922A',
                fontSize: 12,
                letterSpacing: 2,
                fontWeight: 800,
              }}
            >
              LDCE WARRIORS EXAM PREPARATION
            </span>

            <h1
              style={{
                fontFamily: 'Playfair Display, serif',
                color: colors.navy,
                fontWeight: 800,
                fontSize: 'clamp(30px, 5vw, 46px)',
                margin: '12px 0',
              }}
            >
              Test Yourself
            </h1>

            <p
              style={{
                color: colors.muted,
                fontSize: 15,
                lineHeight: 1.7,
              }}
            >
              Select a topic to explore available quizzes.
            </p>

            <Link
              href="/mock-tests"
              className="btn-gold"
              style={{
                display: 'inline-block',
                marginTop: 22,
                textDecoration: 'none',
              }}
            >
              Explore Full Mock Tests →
            </Link>
          </div>

          {loading && (
            <p style={{ textAlign: 'center' }}>
              Loading topics...
            </p>
          )}

          {error && (
            <p
              role="alert"
              style={{
                textAlign: 'center',
                color: '#B42318',
              }}
            >
              {error}
            </p>
          )}

          {!loading && !error && topics.length === 0 && (
            <div
              style={{
                padding: 40,
                background: '#FFFFFF',
                borderRadius: 18,
                textAlign: 'center',
              }}
            >
              No topics available yet.
            </div>
          )}

          <div className="ldce-quiz-topic-grid">
            {topics.map(topic => {
              const topicId = topic.id || topic._id
              const count = counts[topicId] || 0

              return (
                <Link
                  key={topicId}
                  href={`/quiz/topic/${topicId}`}
                  className="ldce-quiz-topic-card"
                >
                  <div className="ldce-quiz-topic-image">
                    {topic.thumbnail ? (
                      <img
                        src={topic.thumbnail}
                        alt={topic.name}
                        loading="lazy"
                      />
                    ) : (
                      <span style={{ fontSize: 64 }}>
                        📚
                      </span>
                    )}
                  </div>

                  <div style={{ padding: 22 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#D4922A',
                        fontWeight: 800,
                        letterSpacing: 1,
                      }}
                    >
                      TOPIC-WISE TEST
                    </span>

                    <h2
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        color: colors.navy,
                        fontSize: 23,
                        fontWeight: 800,
                        margin: '10px 0',
                      }}
                    >
                      {topic.name}
                    </h2>

                    {topic.description && (
                      <p
                        style={{
                          color: colors.muted,
                          fontSize: 13,
                          lineHeight: 1.6,
                          marginBottom: 18,
                        }}
                      >
                        {topic.description}
                      </p>
                    )}

                    <div
                      style={{
                        borderTop: `1px solid ${colors.border}`,
                        paddingTop: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: count ? '#21867A' : colors.muted,
                        }}
                      >
                        {count
                          ? `${count} ${count === 1 ? 'Quiz' : 'Quizzes'}`
                          : 'Coming Soon'}
                      </span>

                      <span
                        style={{
                          color: colors.navy,
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        View Quizzes →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .ldce-quiz-topic-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fill, minmax(270px, 1fr));
          gap: 24px;
        }

        .ldce-quiz-topic-card {
          display: block;
          text-decoration: none;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .ldce-quiz-topic-card:hover {
          transform: translateY(-5px);
          border-color: #E8A838;
          box-shadow: 0 16px 35px rgba(27, 42, 74, 0.12);
        }

        .ldce-quiz-topic-image {
          width: 100%;
          aspect-ratio: 16 / 9;
          background: linear-gradient(
            135deg,
            #E9EDF5,
            #F5F3EF
          );
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .ldce-quiz-topic-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .ldce-quiz-topic-card:hover img {
          transform: scale(1.05);
        }

        @media (max-width: 640px) {
          .ldce-quiz-topic-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </>
  )
}
