
'use client'

import {
  useEffect,
  useState,
} from 'react'

import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ExplanationPage() {
  const { id } = useParams()

  const [attemptId, setAttemptId] = useState('')
  const [result, setResult] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [error, setError] = useState('')
  const [videoEnded, setVideoEnded] = useState(false)

  useEffect(() => {
    const aid = new URLSearchParams(
      window.location.search
    ).get('attemptId')

    if (!aid) {
      setError('Attempt ID is missing')
      return
    }

    setAttemptId(aid)

    let cancelled = false

    async function loadExplanation() {
      try {
        const response = await fetch(
          `/api/quizzes/${id}/result?attemptId=${encodeURIComponent(aid)}`,
          { cache: 'no-store' }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || 'Unable to load quiz'
          )
        }

        if (cancelled) return

        setResult(data)

        if (
          data.status !== 'SUBMITTED' ||
          !data.hasExplanationVideo
        ) {
          return
        }

        const videoResponse = await fetch(
          `/api/quizzes/${id}/explanation-video?attemptId=${encodeURIComponent(aid)}`,
          { cache: 'no-store' }
        )

        const video = await videoResponse.json()

        if (!videoResponse.ok) {
          throw new Error(
            video.error || 'Unable to load video'
          )
        }

        if (!cancelled) {
          setVideoUrl(video.streamUrl)
        }
      } catch (error) {
        if (!cancelled) {
          setError(error.message)
        }
      }
    }

    loadExplanation()

    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <main style={{
      minHeight: '100vh',
      background: '#F5F3EF',
      padding: '55px 18px',
      color: '#1B2A4A',
    }}>
      <section style={{
        maxWidth: 950,
        margin: '0 auto',
        padding: 'clamp(20px,4vw,40px)',
        borderRadius: 20,
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
      }}>
        <p style={{
          color: '#D4922A',
          fontWeight: 800,
        }}>
          LDCE WARRIORS
        </p>

        <h1 style={{
          fontFamily: 'Playfair Display,serif',
          fontSize: 32,
          margin: '12px 0 20px',
        }}>
          Quiz Explanation
        </h1>

        {error && (
          <p style={{ color: '#B42318' }}>
            {error}
          </p>
        )}

        {!result && !error && (
          <p>Loading explanation...</p>
        )}

        {result && (
          <>
            <h2 style={{
              fontSize: 21,
              marginBottom: 22,
            }}>
              {result.quizTitle}
            </h2>

            {result.status !== 'SUBMITTED' ? (
              <p style={{ color: '#B42318' }}>
                This examination was terminated.
                The explanation video is unavailable.
              </p>
            ) : videoUrl ? (
              <>
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  onEnded={() =>
                    setVideoEnded(true)
                  }
                  style={{
                    width: '100%',
                    maxHeight: 520,
                    borderRadius: 14,
                    background: '#12203A',
                  }}
                />

                <p style={{
                  color: '#6B7280',
                  fontSize: 13,
                  marginTop: 12,
                }}>
                  {videoEnded
                    ? 'Explanation video completed.'
                    : 'If autoplay is blocked, press Play.'}
                </p>
              </>
            ) : !error ? (
              <p>
                {result.hasExplanationVideo
                  ? 'Preparing explanation video...'
                  : 'No explanation video available.'}
              </p>
            ) : null}

            {attemptId && (
              <Link
                href={`/exam/${id}/results?attemptId=${encodeURIComponent(attemptId)}`}
                style={{
                  display: 'inline-block',
                  marginTop: 25,
                  padding: '14px 24px',
                  background: '#E8A838',
                  color: '#1B2A4A',
                  fontWeight: 800,
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                View Results →
              </Link>
            )}
          </>
        )}
      </section>
    </main>
  )
}
