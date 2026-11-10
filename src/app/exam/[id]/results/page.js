'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MovingWatermark, { useViewerWatermark } from '@/components/ui/MovingWatermark'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function gradeFor(percent) {
  if (percent >= 90) return { label: 'Excellent!', tone: 'green' }
  if (percent >= 75) return { label: 'Very Good!', tone: 'green' }
  if (percent >= 60) return { label: 'Good!', tone: 'green' }
  if (percent >= 40) return { label: 'Keep Going!', tone: 'amber' }
  return { label: 'Keep Trying!', tone: 'red' }
}

const END_REASONS = {
  TAB_HIDDEN: 'You switched tabs during the exam',
  WINDOW_BLUR: 'You switched to another window during the exam',
  PAGE_EXIT: 'You left the exam page',
  FULLSCREEN_EXIT: 'You left full-screen mode during the exam',
  RESTART_OR_ABANDONED: 'The exam was restarted or left unfinished',
}

function Laurel({ flip }) {
  return (
    <svg
      viewBox="0 0 60 100"
      className="sc-laurel"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      <path d="M44 96C22 82 12 58 18 18" fill="none" stroke="#E6A817" strokeWidth="3" strokeLinecap="round" />
      {[
        [17, 22, -40], [14, 36, -30], [14, 50, -18], [17, 64, -6], [23, 77, 8], [32, 88, 22],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x - 6} cy={y} rx="9" ry="4.5" fill="#F4B92A" transform={`rotate(${r - 35} ${x - 6} ${y})`} />
          <ellipse cx={x + 7} cy={y - 3} rx="9" ry="4.5" fill="#E6A817" transform={`rotate(${r + 40} ${x + 7} ${y - 3})`} />
        </g>
      ))}
    </svg>
  )
}

function ExplanationVideo({ quizId, attemptId, available, hasThumbnail, watermark }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [thumbFailed, setThumbFailed] = useState(false)
  const boxRef = useRef(null)
  const videoRef = useRef(null)

  // Full screen must include the watermark: enlarge the whole box instead of the
  // bare video, and don't allow the phone's own full-screen video player (iOS).
  useEffect(() => {
    const v = videoRef.current
    if (!url || !v) return
    const onIosFullscreen = () => v.webkitExitFullscreen?.()
    const onFullscreen = () => {
      if (document.fullscreenElement === v) {
        document.exitFullscreen?.()
          .then(() => boxRef.current?.requestFullscreen?.())
          .catch(() => {})
      }
    }
    v.addEventListener('webkitbeginfullscreen', onIosFullscreen)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      v.removeEventListener('webkitbeginfullscreen', onIosFullscreen)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [url])

  if (!available) return null

  const thumbnail =
    hasThumbnail && !thumbFailed
      ? `/api/quizzes/${quizId}/explanation-thumbnail?attemptId=${encodeURIComponent(attemptId)}`
      : null

  // Fetch the video link only when the student presses play
  async function play() {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/quizzes/${quizId}/explanation-video?attemptId=${encodeURIComponent(attemptId)}`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to load video')
      setUrl(data.streamUrl)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <section className="sc-section">
      <h2 className="sc-section-title">🎬 Explanation Video</h2>
      <div className="sc-video" ref={boxRef}>
        {url ? (
          <video
            ref={videoRef}
            key={url}
            src={url}
            poster={thumbnail || undefined}
            controls
            autoPlay
            playsInline
            preload="auto"
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            onContextMenu={e => e.preventDefault()}
          />
        ) : null}
        {url && <MovingWatermark text={watermark} dark zIndex={4} />}
        {url ? null : (
          <button
            type="button"
            className="sc-thumb"
            onClick={play}
            aria-label="Play explanation video"
          >
            {thumbnail ? (
              <img src={thumbnail} alt="Explanation video" onError={() => setThumbFailed(true)} />
            ) : (
              <span className="sc-thumb-fallback">LDCE Warriors · Explanation</span>
            )}
            <span className="sc-thumb-shade" />
            <span className={`sc-play ${loading ? 'sc-play-loading' : ''}`}>
              {loading ? <span className="sc-spinner" /> : (
                <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                </svg>
              )}
            </span>
            <span className="sc-thumb-label">
              {error ? `${error} — tap to retry` : loading ? 'Loading video…' : 'Tap to watch the explanation'}
            </span>
          </button>
        )}
      </div>
    </section>
  )
}

function AnswerCard({ q, index }) {
  const answered = q.chosenIndex !== null && q.chosenIndex !== undefined
  const correct = answered && q.chosenIndex === q.correctIndex
  const status = correct ? 'correct' : answered ? 'wrong' : 'skipped'
  const statusLabel = { correct: '✓ Correct', wrong: '✗ Wrong', skipped: '— Not Answered' }[status]

  return (
    <article className={`sc-q sc-q-${status}`}>
      <header className="sc-q-head">
        <span className="sc-q-no">Q{index + 1}</span>
        <span className={`sc-q-status sc-q-status-${status}`}>{statusLabel}</span>
        <span className="sc-q-marks">
          {correct ? q.marks : 0} / {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
        </span>
      </header>

      <p className="sc-q-text">{q.text}</p>

      {q.imageUrl && (
        <img src={q.imageUrl} alt={`Question ${index + 1}`} className="sc-q-img" />
      )}

      <ul className="sc-opts">
        {q.options.map((option, i) => {
          const isCorrect = i === q.correctIndex
          const isChosen = answered && i === q.chosenIndex
          const cls = isCorrect ? 'sc-opt-correct' : isChosen ? 'sc-opt-wrong' : ''
          return (
            <li key={i} className={`sc-opt ${cls}`}>
              <span className="sc-opt-letter">{LETTERS[i]}</span>
              <span className="sc-opt-text">{option}</span>
              {isChosen && <span className="sc-opt-tag">Your answer</span>}
              {isCorrect && !isChosen && <span className="sc-opt-tag">Correct answer</span>}
              {isCorrect && <span className="sc-opt-icon">✓</span>}
              {isChosen && !isCorrect && <span className="sc-opt-icon">✗</span>}
            </li>
          )
        })}
      </ul>

      {!correct && (
        <p className="sc-q-key">
          Correct answer: <strong>{LETTERS[q.correctIndex]}. {q.options[q.correctIndex]}</strong>
        </p>
      )}

      {q.explanation && (
        <div className="sc-q-expl">
          <strong>Explanation: </strong>{q.explanation}
        </div>
      )}
    </article>
  )
}

export default function QuizResultsPage() {
  const { id } = useParams()
  // Student's name + phone over the scorecard, answer key and video
  const viewerMark = useViewerWatermark()
  const [attemptId, setAttemptId] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const aid = new URLSearchParams(window.location.search).get('attemptId')
    if (!aid) {
      setError('Missing attempt ID')
      return
    }
    setAttemptId(aid)

    let cancelled = false
    let retryTimer
    let retries = 3

    async function loadResult() {
      try {
        const response = await fetch(
          `/api/quizzes/${id}/result?attemptId=${encodeURIComponent(aid)}`,
          { cache: 'no-store' }
        )
        const data = await response.json()
        if (cancelled) return

        if (!response.ok) {
          if (data.error === 'Exam still in progress' && retries-- > 0) {
            retryTimer = setTimeout(loadResult, 1000)
            return
          }
          throw new Error(data.error || 'Unable to load result')
        }
        setResult(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    loadResult()
    return () => {
      cancelled = true
      clearTimeout(retryTimer)
    }
  }, [id])

  const submitted = result?.status === 'SUBMITTED'
  const score = result?.score ?? 0
  const maxScore = result?.maxScore ?? 0
  const percent = maxScore > 0 ? (score / maxScore) * 100 : 0
  const grade = gradeFor(percent)

  const review = result?.review || []
  const counts = review.reduce(
    (acc, q) => {
      const answered = q.chosenIndex !== null && q.chosenIndex !== undefined
      if (!answered) acc.skipped++
      else if (q.chosenIndex === q.correctIndex) acc.correct++
      else acc.wrong++
      return acc
    },
    { correct: 0, wrong: 0, skipped: 0 }
  )

  const visible = review
    .map((q, index) => ({ q, index }))
    .filter(({ q }) => {
      if (filter === 'all') return true
      const answered = q.chosenIndex !== null && q.chosenIndex !== undefined
      if (filter === 'skipped') return !answered
      if (filter === 'correct') return answered && q.chosenIndex === q.correctIndex
      return answered && q.chosenIndex !== q.correctIndex
    })

  return (
    <>
      <Navbar />
      <main className="sc-page">
        <MovingWatermark text={viewerMark} mode="page" zIndex={900} />
        <div className="sc-wrap">
          {error && <p className="sc-error">{error}</p>}
          {!result && !error && <p className="sc-loading">Loading your scorecard…</p>}

          {result && (
            <>
              {/* SCORECARD */}
              <section className="sc-card">
                <div className="sc-heading">
                  <Laurel />
                  <h1>Exam Scorecard</h1>
                  <Laurel flip />
                </div>
                <span className="sc-heading-line" />
                <h2 className="sc-quiz-title">{result.quizTitle}</h2>

                <hr className="sc-rule" />

                <div className="sc-tiles">
                  <div className="sc-tile sc-tile-score">
                    <span className="sc-tile-label">Your Score</span>
                    <strong className="sc-tile-value">{score} / {maxScore || '—'}</strong>
                  </div>

                  <div className="sc-tile sc-tile-percent">
                    <span className="sc-tile-label">Percentage</span>
                    <strong className="sc-tile-value">{percent.toFixed(2)}%</strong>
                  </div>

                  {submitted ? (
                    <div className="sc-tile sc-tile-status">
                      <span className="sc-status-line">
                        <span className="sc-check">✓</span> Successfully Submitted
                      </span>
                      <span className={`sc-ribbon sc-ribbon-${grade.tone}`}>{grade.label}</span>
                    </div>
                  ) : (
                    <div className="sc-tile sc-tile-ended">
                      <span className="sc-status-line sc-status-ended">
                        <span className="sc-cross">!</span> Exam Terminated
                      </span>
                      <span className="sc-ended-reason">
                        {END_REASONS[result.endReason] || result.endReason || 'The exam ended early'}
                      </span>
                    </div>
                  )}
                </div>

                <hr className="sc-rule" />

                <div className="sc-best">All the Best!</div>
              </section>

              {/* EXPLANATION VIDEO */}
              {submitted && attemptId && (
                <ExplanationVideo
                  quizId={id}
                  attemptId={attemptId}
                  available={result.hasExplanationVideo}
                  hasThumbnail={result.hasExplanationThumbnail}
                  watermark={viewerMark}
                />
              )}

              {/* ANSWER KEY */}
              {submitted && review.length > 0 ? (
                <section className="sc-section">
                  <h2 className="sc-section-title">📝 Answer Key</h2>

                  <div className="sc-filters">
                    {[
                      ['all', `All (${review.length})`],
                      ['correct', `Correct (${counts.correct})`],
                      ['wrong', `Wrong (${counts.wrong})`],
                      ['skipped', `Not Answered (${counts.skipped})`],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        className={`sc-filter sc-filter-${key} ${filter === key ? 'active' : ''}`}
                        onClick={() => setFilter(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {visible.length === 0 ? (
                    <p className="sc-none">No questions in this list.</p>
                  ) : (
                    visible.map(({ q, index }) => <AnswerCard key={q.id} q={q} index={index} />)
                  )}
                </section>
              ) : !submitted ? (
                <p className="sc-none">
                  The answer key and explanation video are only available for exams that were submitted.
                </p>
              ) : null}

              <div className="sc-actions">
                <Link href="/quiz" className="sc-btn sc-btn-gold">More Tests →</Link>
                <Link href="/materials" className="sc-btn">Read Digital Textbook</Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      <style>{`
        .sc-page { background:#F5F3EF; min-height:100vh; padding:110px 16px 60px; color:#0F1747; }
        .sc-wrap { max-width:960px; margin:0 auto; }
        .sc-loading, .sc-none { text-align:center; color:#6B7280; padding:30px 0; }
        .sc-error { text-align:center; color:#B42318; font-weight:700; padding:30px 0; }

        /* SCORECARD */
        .sc-card {
          background:#fff; border:2.5px solid #1D4ED8; border-radius:28px;
          padding:18px clamp(12px,2.5vw,22px) 20px; text-align:center;
          max-width:760px; margin:0 auto;
          box-shadow:0 10px 30px rgba(29,78,216,.12);
        }
        .sc-heading { display:flex; align-items:center; justify-content:center; gap:clamp(6px,2vw,18px); }
        .sc-heading h1 {
          font-family:'Playfair Display', Georgia, serif; font-weight:900; color:#0B1F5C;
          font-size:clamp(22px,4.2vw,34px); line-height:1.1; margin:0;
        }
        .sc-laurel { width:clamp(22px,4vw,36px); height:auto; flex-shrink:0; }
        .sc-heading-line { display:block; width:clamp(90px,20vw,200px); height:3px; border-radius:4px; background:#E50914; margin:6px auto 10px; }
        .sc-quiz-title {
          font-family:'Playfair Display', Georgia, serif; font-weight:900; color:#E50914;
          font-size:clamp(19px,3.6vw,28px); line-height:1.15; margin:0; overflow-wrap:anywhere;
        }
        .sc-rule { border:0; height:2px; background:#1D4ED8; opacity:.85; margin:14px 0; }

        .sc-tiles { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
        .sc-tile {
          border-radius:14px; padding:12px 8px; display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:5px; min-height:92px;
        }
        .sc-tile-label { font-family:'Playfair Display', Georgia, serif; font-weight:800; font-size:clamp(14px,1.8vw,17px); color:#0B1F5C; }
        .sc-tile-value { font-family:'Playfair Display', Georgia, serif; font-weight:900; font-size:clamp(26px,4vw,38px); line-height:1; }
        .sc-tile-score { background:#FBF3E8; border:1.5px solid #E7D6C1; }
        .sc-tile-score .sc-tile-value { color:#D90A16; }
        .sc-tile-percent { background:#E5F2FD; border:1.5px solid #A9CFF2; }
        .sc-tile-percent .sc-tile-value { color:#0A1FD8; }
        .sc-tile-status { background:#EAF8E6; border:1.5px solid #8FD48A; }
        .sc-tile-ended { background:#FDECEC; border:1.5px solid #F3A6A6; }
        .sc-status-line { display:flex; align-items:center; gap:8px; font-family:'Playfair Display', Georgia, serif; font-weight:800; font-size:clamp(12px,1.4vw,14px); color:#14532D; }
        .sc-status-ended { color:#991B1B; }
        .sc-check, .sc-cross {
          width:22px; height:22px; flex-shrink:0; border-radius:50%; color:#fff; font-size:13px; font-weight:900;
          display:flex; align-items:center; justify-content:center; font-family:sans-serif;
        }
        .sc-check { background:#16A34A; }
        .sc-cross { background:#DC2626; }
        .sc-ended-reason { font-size:13px; color:#7F1D1D; font-weight:600; }
        .sc-ribbon {
          position:relative; display:inline-block; padding:5px 18px; color:#fff; font-weight:900;
          font-family:'Playfair Display', Georgia, serif; font-size:clamp(15px,1.9vw,19px);
          border-radius:6px; transform:rotate(-2deg); text-shadow:0 2px 0 rgba(0,0,0,.2);
          white-space:nowrap; max-width:100%;
        }
        .sc-ribbon::before, .sc-ribbon::after {
          content:''; position:absolute; top:7px; width:12px; height:100%; z-index:-1;
          background:inherit; filter:brightness(.8);
        }
        .sc-ribbon::before { left:-8px; clip-path:polygon(0 0,100% 0,100% 100%,0 100%,40% 50%); }
        .sc-ribbon::after { right:-8px; clip-path:polygon(0 0,100% 0,60% 50%,100% 100%,0 100%); }
        .sc-ribbon-green { background:linear-gradient(180deg,#22C55E,#15803D); }
        .sc-ribbon-amber { background:linear-gradient(180deg,#F59E0B,#B45309); }
        .sc-ribbon-red { background:linear-gradient(180deg,#EF4444,#B91C1C); }

        .sc-best {
          display:inline-block; padding:7px clamp(26px,6vw,56px); border-radius:999px;
          background:linear-gradient(180deg,#E5101F,#8E0710); border:2px solid #F5C518;
          color:#fff; font-family:'Playfair Display', Georgia, serif; font-style:italic; font-weight:900;
          font-size:clamp(19px,3vw,28px); box-shadow:0 6px 14px rgba(142,7,16,.28);
        }

        /* SECTIONS */
        .sc-section { margin-top:28px; background:#fff; border:1px solid #E5E7EB; border-radius:22px; padding:clamp(16px,3vw,26px); }
        .sc-section-title { font-size:22px; font-weight:900; color:#0B1F5C; margin:0 0 16px; }
        .sc-video { position:relative; border-radius:16px; overflow:hidden; background:#12203A; aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; }
        .sc-video video { width:100%; height:100%; display:block; background:#12203A; }
        .sc-thumb {
          position:relative; width:100%; height:100%; padding:0; border:0; cursor:pointer;
          background:linear-gradient(135deg,#1B2A4A,#3B1D7A); display:block; overflow:hidden;
        }
        .sc-thumb img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .4s ease; }
        .sc-thumb:hover img { transform:scale(1.03); }
        .sc-thumb-fallback { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.35); font-weight:900; font-size:clamp(16px,3vw,26px); letter-spacing:1px; }
        .sc-thumb-shade { position:absolute; inset:0; background:linear-gradient(180deg,rgba(0,0,0,.05) 40%,rgba(0,0,0,.55)); }
        .sc-play {
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:clamp(64px,10vw,86px); height:clamp(64px,10vw,86px); border-radius:50%;
          background:#E50914; color:#fff; display:flex; align-items:center; justify-content:center;
          box-shadow:0 0 0 8px rgba(229,9,20,.25), 0 10px 25px rgba(0,0,0,.35);
          transition:transform .2s ease, box-shadow .2s ease;
        }
        .sc-play svg { margin-left:4px; }
        .sc-thumb:hover .sc-play { transform:translate(-50%,-50%) scale(1.08); box-shadow:0 0 0 12px rgba(229,9,20,.25), 0 12px 28px rgba(0,0,0,.4); }
        .sc-thumb-label { position:absolute; left:0; right:0; bottom:14px; color:#fff; font-weight:800; font-size:14px; text-shadow:0 1px 3px rgba(0,0,0,.6); }
        .sc-spinner { width:30px; height:30px; border-radius:50%; border:3px solid rgba(255,255,255,.35); border-top-color:#fff; animation:scSpin .9s linear infinite; }
        @keyframes scSpin { to { transform:rotate(360deg) } }

        .sc-filters { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
        .sc-filter { padding:8px 14px; border-radius:999px; border:1px solid #E5E7EB; background:#fff; font-size:13px; font-weight:800; color:#0B1F5C; cursor:pointer; }
        .sc-filter.active { background:#0B1F5C; color:#fff; border-color:#0B1F5C; }
        .sc-filter-correct.active { background:#16A34A; border-color:#16A34A; }
        .sc-filter-wrong.active { background:#DC2626; border-color:#DC2626; }
        .sc-filter-skipped.active { background:#6B7280; border-color:#6B7280; }

        /* QUESTION */
        .sc-q { border:1.5px solid #E5E7EB; border-left-width:6px; border-radius:16px; padding:18px; margin-bottom:14px; }
        .sc-q-correct { border-left-color:#16A34A; }
        .sc-q-wrong { border-left-color:#DC2626; }
        .sc-q-skipped { border-left-color:#9CA3AF; }
        .sc-q-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
        .sc-q-no { background:#0B1F5C; color:#fff; font-weight:900; font-size:13px; padding:4px 10px; border-radius:8px; }
        .sc-q-status { font-size:12px; font-weight:900; padding:4px 10px; border-radius:999px; }
        .sc-q-status-correct { background:#DCFCE7; color:#166534; }
        .sc-q-status-wrong { background:#FEE2E2; color:#991B1B; }
        .sc-q-status-skipped { background:#F3F4F6; color:#4B5563; }
        .sc-q-marks { margin-left:auto; font-size:12px; font-weight:800; color:#6B7280; }
        .sc-q-text { font-size:17px; font-weight:700; line-height:1.6; margin:0 0 14px; white-space:pre-wrap; }
        .sc-q-img { display:block; max-width:100%; max-height:340px; object-fit:contain; border-radius:12px; margin:0 0 14px; }

        .sc-opts { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }
        .sc-opt { display:flex; align-items:center; gap:10px; padding:10px 12px; border:1.5px solid #E5E7EB; border-radius:12px; background:#FAFAFA; }
        .sc-opt-letter { width:28px; height:28px; flex-shrink:0; border-radius:50%; background:#E5E7EB; color:#374151; font-weight:900; font-size:13px; display:flex; align-items:center; justify-content:center; }
        .sc-opt-text { flex:1; min-width:0; font-size:15px; line-height:1.5; overflow-wrap:anywhere; }
        .sc-opt-tag { font-size:11px; font-weight:900; padding:3px 8px; border-radius:999px; background:rgba(255,255,255,.75); white-space:nowrap; }
        .sc-opt-icon { font-weight:900; font-size:18px; width:20px; text-align:center; }
        .sc-opt-correct { background:#ECFDF3; border-color:#4ADE80; color:#14532D; }
        .sc-opt-correct .sc-opt-letter { background:#16A34A; color:#fff; }
        .sc-opt-wrong { background:#FEF2F2; border-color:#F87171; color:#7F1D1D; }
        .sc-opt-wrong .sc-opt-letter { background:#DC2626; color:#fff; }

        .sc-q-key { margin:12px 0 0; font-size:14px; color:#14532D; }
        .sc-q-expl { margin-top:12px; padding:12px 14px; background:#F5F3EF; border-radius:10px; font-size:14px; line-height:1.7; }

        .sc-actions { display:flex; justify-content:center; flex-wrap:wrap; gap:12px; margin-top:28px; }
        .sc-btn { padding:12px 22px; border-radius:12px; font-weight:800; text-decoration:none; background:#fff; color:#0B1F5C; border:1px solid #E5E7EB; }
        .sc-btn-gold { background:#E8A838; border-color:#E8A838; color:#1B2A4A; }

        @media (max-width: 640px) {
          .sc-page { padding:96px 12px 44px; }
          .sc-card { border-radius:20px; }
          .sc-tiles { grid-template-columns:1fr 1fr; gap:10px; }
          .sc-tile-status, .sc-tile-ended { grid-column:span 2; min-height:auto; }
          .sc-tile { min-height:84px; padding:10px 6px; }
          .sc-q { padding:14px; }
          .sc-q-text { font-size:16px; }
          .sc-opt-tag { display:none; }
        }
      `}</style>
    </>
  )
}
