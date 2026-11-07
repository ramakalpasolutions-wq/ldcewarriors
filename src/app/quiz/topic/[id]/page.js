
'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import {
  FiClipboard,
  FiAward,
  FiClock,
  FiUnlock,
  FiPlay,
  FiArrowRight,
  FiRefreshCw,
} from 'react-icons/fi'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

function validFamilyMembership(user) {
  if (!user?.isPremium) return false

  if (
    user.premiumExpiresAt &&
    new Date(user.premiumExpiresAt).getTime() <= Date.now()
  ) {
    return false
  }

  return true
}

/* ---------------------------------
   STAT COMPONENT
--------------------------------- */

function Stat({ icon, label, value, type }) {
  return (
    <div className="mock-stat">
      <span className={`mock-stat-icon ${type}`}>
        {icon}
      </span>

      <div className="mock-stat-text">
        <span className="mock-stat-label">
          {label}
        </span>

        <strong className={`mock-stat-value ${type}`}>
          {value}
        </strong>
      </div>
    </div>
  )
}

/* ---------------------------------
   QUIZ CARD
--------------------------------- */

function QuizCard({
  quiz,
  index,
  membership,
  onRetryMembership,
}) {
  const isFamily = membership === 'family'
  const isChecking = membership === 'checking'
  const hasError = membership === 'error'

  const displayNumber = String(index + 1)
    .padStart(2, '0')

  const totalMarks = Number(quiz.totalMarks) || 0

  const href = isFamily
    ? `/exam/${quiz.id}`
    : '/join-family'

  return (
    <article className="mock-card">
      <div className="mock-card-content">

        {/* TITLE */}

        <div className="mock-card-top">
          <span className="mock-category">
            LDCE WARRIORS
          </span>

          <h2 className="mock-title">
            Mock Test - {displayNumber}
          </h2>

          <p className="mock-subtitle">
            Practice Today
            <span className="mock-subtitle-arrow">
              →
            </span>
            Perform Better Tomorrow
          </p>

          <div className="mock-gold-line" />

          <p className="mock-original-title">
            {quiz.title}
          </p>
        </div>

        {/* QUESTION STATS */}

        <div className="mock-stats">
          <Stat
            type="questions"
            icon={<FiClipboard />}
            label="Questions"
            value={quiz.questionCount}
          />

          <Stat
            type="marks"
            icon={<FiAward />}
            label="Marks"
            value={totalMarks}
          />

          <Stat
            type="time"
            icon={<FiClock />}
            label="Time"
            value={`${quiz.durationMinutes} Min`}
          />
        </div>

        {/* FAMILY / NON FAMILY BUTTON */}

        {hasError ? (
          <button
            type="button"
            className="mock-action mock-action-retry"
            onClick={onRetryMembership}
          >
            <FiRefreshCw />
            <span>Check Membership</span>
            <FiArrowRight />
          </button>
        ) : isChecking ? (
          <div className="mock-action mock-action-loading">
            Checking Membership...
          </div>
        ) : (
          <Link
            href={href}
            className={`mock-action ${
              isFamily
                ? 'mock-action-start'
                : 'mock-action-unlock'
            }`}
          >
            <span className="mock-action-icon-wrap">
              {isFamily ? <FiPlay /> : <FiUnlock />}
            </span>

            <span className="mock-action-divider" />

            <span className="mock-action-text">
              {isFamily ? 'Start Test' : 'Unlock Now'}
            </span>

            <FiArrowRight className="mock-action-arrow" />
          </Link>
        )}
      </div>
    </article>
  )
}

/* ---------------------------------
   TOPIC QUIZZES PAGE
--------------------------------- */

export default function TopicQuizzesPage() {
  const { id } = useParams()

  const [topic, setTopic] = useState(null)
  const [quizzes, setQuizzes] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [membership, setMembership] =
    useState('checking')

  /* CHECK FAMILY MEMBERSHIP */

  const loadMembership = useCallback(async () => {
    setMembership('checking')

    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'same-origin',
        cache: 'no-store',
      })

      if (response.status === 401) {
        setMembership('visitor')
        return
      }

      if (!response.ok) {
        throw new Error('Membership check failed')
      }

      const data = await response.json()

      if (!data.success || !data.user) {
        setMembership('visitor')
        return
      }

      setMembership(
        validFamilyMembership(data.user)
          ? 'family'
          : 'visitor'
      )
    } catch (err) {
      console.error('Membership check error:', err)
      setMembership('error')
    }
  }, [])

  useEffect(() => {
    loadMembership()
  }, [loadMembership])

  /* LOAD TOPIC QUIZZES */

  useEffect(() => {
    let cancelled = false

    async function loadQuizzes() {
      setLoading(true)
      setError('')

      try {
        const [topicsResponse, quizzesResponse] =
          await Promise.all([
            fetch('/api/admin/topics'),
            fetch('/api/quizzes'),
          ])

        const [topicsData, quizzesData] =
          await Promise.all([
            topicsResponse.json(),
            quizzesResponse.json(),
          ])

        if (
          !topicsResponse.ok ||
          !topicsData.success
        ) {
          throw new Error('Unable to load topics')
        }

        if (
          !quizzesResponse.ok ||
          !quizzesData.success
        ) {
          throw new Error('Unable to load quizzes')
        }

        const currentTopic = (
          topicsData.topics || []
        ).find(
          item => (item.id || item._id) === id
        )

        if (!currentTopic) {
          throw new Error('Topic not found')
        }

        const topicQuizzes = (
          quizzesData.quizzes || []
        ).filter(
          quiz =>
            quiz.mode === 'TOPIC' &&
            quiz.topicId === id
        )

        if (!cancelled) {
          setTopic(currentTopic)
          setQuizzes(topicQuizzes)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadQuizzes()

    return () => {
      cancelled = true
    }
  }, [id])

  /* ---------------------------------
     PAGE RENDER
  --------------------------------- */

  return (
    <>
      <Navbar />

      <main className="mock-page">
        <div className="mock-container">

          {/* BACK BUTTON */}

          <Link href="/quiz" className="mock-back">
            ← All Topics
          </Link>

          {/* TOPIC TITLE */}

          <div className="mock-page-heading">
            <h1>
              {topic?.name || 'Topic Quizzes'}
            </h1>
          </div>

          {/* FAMILY STATUS */}

          {membership === 'family' && (
            <div className="mock-member-note">
              ✓ Family Membership Active — Your tests
              are unlocked.
            </div>
          )}

          {/* LOADING */}

          {loading && (
            <p className="mock-info">
              Loading available tests...
            </p>
          )}

          {/* ERROR */}

          {error && (
            <p className="mock-error" role="alert">
              {error}
            </p>
          )}

          {/* EMPTY STATE */}

          {!loading &&
            !error &&
            quizzes.length === 0 && (
              <div className="mock-empty">
                <h2>Tests Coming Soon</h2>

                <p>
                  No published tests are available
                  for this topic yet.
                </p>

                <Link href="/quiz">
                  Explore Other Topics →
                </Link>
              </div>
            )}

          {/* RESPONSIVE QUIZ GRID */}

          {!loading && !error && (
            <div className="mock-grid">
              {quizzes.map((quiz, index) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  index={index}
                  membership={membership}
                  onRetryMembership={loadMembership}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* ---------------------------------
          STYLES
      --------------------------------- */}

      <style jsx global>{`

        /* PAGE */

        .mock-page {
          min-height: 100vh;
          background: #F5F3EF;
          padding: 115px 20px 90px;
        }

        .mock-container {
          max-width: 1380px;
          margin: 0 auto;
        }

        .mock-back {
          display: inline-block;
          text-decoration: none;
          color: #667085;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 25px;
        }

        .mock-back:hover {
          color: #1B2A4A;
        }

        /* TITLE */

        .mock-page-heading {
          text-align: center;
          margin-bottom: 38px;
        }

        .mock-page-heading h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 5vw, 46px);
          color: #1B2A4A;
          font-weight: 800;
          margin-bottom: 10px;
        }

        /* FAMILY STATUS */

        .mock-member-note {
          width: fit-content;
          max-width: 100%;
          margin: 0 auto 32px;
          padding: 12px 20px;
          background: #E9F7F4;
          border: 1px solid #B9E4DC;
          border-radius: 30px;
          color: #21867A;
          font-size: 13px;
          font-weight: 700;
          text-align: center;
        }

        .mock-info,
        .mock-error {
          text-align: center;
          padding: 25px;
          font-size: 15px;
        }

        .mock-error {
          color: #B42318;
        }

        .mock-empty {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 20px;
          padding: 45px 20px;
          text-align: center;
        }

        .mock-empty h2 {
          color: #1B2A4A;
          font-size: 24px;
          margin-bottom: 12px;
        }

        .mock-empty p {
          color: #667085;
          margin-bottom: 20px;
        }

        .mock-empty a {
          color: #D4922A;
          font-weight: 800;
        }

        /* DESKTOP: FOUR CARDS */

        .mock-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
          align-items: stretch;
        }

        /* CARD */

        .mock-card {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: flex;
          min-width: 0;
          background: #FFFFFF;
          border: 1.5px solid #D5DFF1;
          border-radius: 26px;
          box-shadow: 0 12px 28px rgba(27, 42, 74, .08);
          transition:
            transform .3s ease,
            box-shadow .3s ease,
            border-color .3s ease;
        }

        .mock-card:hover {
          transform: translateY(-6px);
          border-color: #E8A838;
          box-shadow: 0 20px 45px rgba(27, 42, 74, .14);
        }

        /* GOLD CORNER */

        .mock-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 145px;
          height: 90px;
          background: #FFC400;
          border-radius: 0 0 100% 0;
          z-index: 0;
        }

        /* PURPLE CORNER */

        .mock-card::after {
          content: '';
          position: absolute;
          right: 0;
          bottom: 0;
          width: 95px;
          height: 82px;
          background: #9A64F4;
          border-radius: 100% 0 0 0;
          z-index: 0;
        }

        .mock-card-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 0;
          padding: 52px 16px 20px;
        }

        .mock-card-top {
          text-align: center;
          flex: 1;
        }

        .mock-category {
          display: inline-block;
          background: rgba(27, 42, 74, .05);
          color: #1B2A4A;
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .mock-title {
          color: #071C4B;
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(24px, 2vw, 30px);
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -1px;
          margin: 24px 0 16px;
          white-space: nowrap;
        }

        .mock-subtitle {
          color: #0A2D69;
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(12px, 1.1vw, 16px);
          font-weight: 600;
          line-height: 1.65;
        }

        .mock-subtitle-arrow {
          display: inline-block;
          margin: 0 8px;
          font-family: 'DM Sans', sans-serif;
          font-style: normal;
          font-size: 23px;
        }

        .mock-gold-line {
          height: 5px;
          width: 86%;
          margin: 23px auto 16px;
          background: #FFC400;
          border-radius: 50%;
          transform: rotate(-2deg);
        }

        .mock-original-title {
          color: #667085;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 27px;
          overflow-wrap: anywhere;
        }

        /* QUESTIONS / MARKS / TIME */

        .mock-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          background: #F8F7F7;
          border-radius: 18px;
          padding: 18px 9px;
          margin-bottom: 18px;
        }

        .mock-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          justify-content: center;
          gap: 10px;
          padding: 4px;
          min-width: 0;
        }

        .mock-stat + .mock-stat {
          border-left: 1px solid #D4D4D8;
        }

        .mock-stat-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 24px;
        }

        .mock-stat-icon.questions {
          background: #E9DCFF;
          color: #6324CF;
        }

        .mock-stat-icon.marks {
          background: #C5F5DF;
          color: #087B52;
        }

        .mock-stat-icon.time {
          background: #FFDFD5;
          color: #E64B17;
        }

        .mock-stat-text {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .mock-stat-label {
          color: #071C4B;
          font-size: 13px;
          font-weight: 800;
        }

        .mock-stat-value {
          font-size: clamp(17px, 1.6vw, 23px);
          font-weight: 900;
          white-space: nowrap;
        }

        .mock-stat-value.questions {
          color: #6324CF;
        }

        .mock-stat-value.marks {
          color: #087B52;
        }

        .mock-stat-value.time {
          color: #E64B17;
        }

        /* START TEST / UNLOCK BUTTON */

        .mock-action {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 9px;
          width: 100%;
          min-height: 64px;
          padding: 10px 12px;
          border: 0;
          border-radius: 18px;
          color: #FFFFFF;
          text-decoration: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(18px, 1.6vw, 23px);
          font-weight: 900;
          letter-spacing: -.5px;
          box-shadow: 0 10px 18px rgba(0,0,0,.14);
          transition:
            filter .2s ease,
            transform .2s ease;
        }

        .mock-action:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
        }

        .mock-action-unlock {
          background: linear-gradient(
            180deg,
            #FF1933,
            #C90013
          );
        }

        .mock-action-start {
          background: linear-gradient(
            180deg,
            #8038F4,
            #4311AE
          );
        }

        .mock-action-retry {
          background: #1B2A4A;
        }

        .mock-action-loading {
          background: #8992A3;
          cursor: wait;
          font-size: 15px;
        }

        .mock-action-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #FFFFFF;
          color: #662AD0;
          font-size: 23px;
        }

        .mock-action-unlock .mock-action-icon-wrap {
          color: #CE071C;
        }

        .mock-action-divider {
          height: 37px;
          width: 2px;
          background: rgba(255,255,255,.65);
        }

        .mock-action-text {
          flex: 1;
          text-align: center;
          white-space: nowrap;
        }

        .mock-action-arrow {
          flex-shrink: 0;
          font-size: 24px;
        }

        /* SMALL DESKTOP: THREE CARDS */

        @media (max-width: 1200px) {
          .mock-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        /* TABLET: TWO CARDS */

        @media (max-width: 900px) {
          .mock-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        /* MOBILE: COMPACT CARDS */

        @media (max-width: 680px) {
          .mock-page {
            padding: 100px 12px 45px;
          }

          .mock-back {
            margin-bottom: 14px;
            font-size: 12px;
          }

          .mock-page-heading {
            margin-bottom: 20px;
          }

          .mock-page-heading h1 {
            font-size: clamp(26px, 8vw, 34px);
            margin-bottom: 6px;
          }

          .mock-member-note {
            max-width: 100%;
            padding: 9px 13px;
            font-size: 11px;
            margin-bottom: 18px;
          }

          .mock-grid {
            grid-template-columns: minmax(0, 1fr);
            justify-items: center;
            gap: 15px;
          }

          .mock-card {
            width: 100%;
            max-width: 330px;
            margin: 0 auto;
            border-radius: 18px;
            box-shadow: 0 6px 16px rgba(27, 42, 74, .08);
          }

          .mock-card::before {
            width: 84px;
            height: 54px;
          }

          .mock-card::after {
            width: 62px;
            height: 50px;
          }

          .mock-card-content {
            padding: 24px 13px 14px;
          }

          .mock-category {
            font-size: 9px;
            letter-spacing: .7px;
            padding: 4px 10px;
          }

          .mock-title {
            font-size: 22px;
            line-height: 1.25;
            letter-spacing: -.5px;
            white-space: normal;
            margin: 14px 0 8px;
          }

          .mock-subtitle {
            font-size: 12px;
            line-height: 1.45;
          }

          .mock-subtitle-arrow {
            font-size: 16px;
            margin: 0 4px;
          }

          .mock-gold-line {
            width: 80%;
            height: 3px;
            margin: 12px auto 10px;
          }

          .mock-original-title {
            font-size: 11px;
            line-height: 1.5;
            margin-bottom: 14px;
          }

          .mock-stats {
            padding: 10px 5px;
            border-radius: 12px;
            margin-bottom: 12px;
          }

          .mock-stat {
            gap: 5px;
            padding: 3px 1px;
          }

          .mock-stat-icon {
            width: 32px;
            height: 32px;
            font-size: 17px;
          }

          .mock-stat-label {
            font-size: 10px;
          }

          .mock-stat-value {
            font-size: 15px;
          }

          .mock-action {
            min-height: 47px;
            gap: 6px;
            padding: 7px 10px;
            border-radius: 12px;
            font-size: 17px;
            box-shadow: 0 6px 12px rgba(0,0,0,.13);
          }

          .mock-action-icon-wrap {
            width: 31px;
            height: 31px;
            font-size: 16px;
          }

          .mock-action-divider {
            height: 25px;
            width: 1px;
          }

          .mock-action-arrow {
            font-size: 18px;
          }

          .mock-action-loading,
          .mock-action-retry {
            font-size: 13px;
          }
        }

        /* VERY SMALL PHONES */

        @media (max-width: 360px) {
          .mock-card {
            max-width: 100%;
          }

          .mock-title {
            font-size: 20px;
          }

          .mock-action {
            font-size: 15px;
          }

          .mock-stat-value {
            font-size: 13px;
          }
        }

      `}</style>
    </>
  )
}
