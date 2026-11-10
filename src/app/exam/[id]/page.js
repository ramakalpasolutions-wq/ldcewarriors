
'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  FiVideo,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
} from 'react-icons/fi'

const navy = '#1B2A4A'
const gold = '#E8A838'
const teal = '#2A9D8F'

const panel = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  padding: 22,
}

function ExplanationVideoPreview({ available, thumbnailUrl }) {
  if (!available) return null

  return (
    <section className="ldce-explanation-card">
      <div className="ldce-explanation-card-heading">
        <div className="ldce-explanation-heading-icon">
          <FiVideo size={19} />
        </div>
        <div>
          <h3>Explanation Video</h3>
          <p>Detailed answer explanations</p>
        </div>
      </div>

      <div className="ldce-explanation-thumbnail">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="Quiz explanation video thumbnail"
            draggable={false}
            onContextMenu={event => event.preventDefault()}
            className="ldce-explanation-preview-image"
          />
        ) : (
          <div className="ldce-explanation-placeholder">
            <FiVideo size={35} />
            <span>Explanation Video Available</span>
          </div>
        )}
      </div>

      <p className="ldce-explanation-description">
        Watch the detailed explanation after submitting your examination.
      </p>
      <div className="ldce-explanation-status">
        <FiVideo size={14} />
        <span>Available After Submission</span>
      </div>
    </section>
  )
}

export default function ExamPage() {
  const { id } = useParams()
  const router = useRouter()

  const [status, setStatus] = useState('ready')
  const [message, setMessage] = useState('')
  const [exam, setExam] = useState(null)

  const [activeIndex, setActiveIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  const attemptRef = useRef(null)
  const answersRef = useRef({})
  const doneRef = useRef(false)
  const fullscreenRef = useRef(false)

  /* -----------------------------------------
     FINISH EXAMINATION
  ----------------------------------------- */

  const finish = useCallback(
    async (reason = 'USER_SUBMITTED') => {
      if (doneRef.current || !attemptRef.current) {
        return
      }

      doneRef.current = true
      setStatus('finishing')

      const attemptId = attemptRef.current

      try {
        const response = await fetch(
          `/api/quizzes/${id}/finish`,
          {
            method: 'POST',
            credentials: 'same-origin',
            keepalive: true,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              attemptId,
              answers: answersRef.current,
              reason,
            }),
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || 'Unable to finish examination'
          )
        }

        if (document.fullscreenElement) {
          await document
            .exitFullscreen()
            .catch(() => {})
        }

        router.replace(
          `/exam/${id}/results?attemptId=${encodeURIComponent(attemptId)}`
        )
      } catch (error) {
        console.error('Exam finish error:', error)

        setMessage(
          `${error.message}. Please contact support if your submission was not recorded.`
        )
        setStatus('ended')
      }
    },
    [id, router]
  )

  /* -----------------------------------------
     START EXAMINATION
  ----------------------------------------- */

  async function startExam() {
    if (status !== 'ready') return

    setStatus('loading')
    setMessage('')

    try {
      fullscreenRef.current = false

      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen()
          fullscreenRef.current =
            Boolean(document.fullscreenElement)
        } catch (error) {
          console.warn(
            'Fullscreen is not supported or was declined:',
            error
          )
        }
      }

      const response = await fetch(
        `/api/quizzes/${id}/start`,
        {
          method: 'POST',
          credentials: 'same-origin',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 && data.loginRequired) {
          if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {})
          }

          router.replace('/auth/login')
          return
        }

        if (
          response.status === 403 &&
          data.redirectTo === '/join-family'
        ) {
          if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {})
          }

          router.replace('/join-family')
          return
        }

        throw new Error(
          data.error || 'Could not start examination'
        )
      }

      doneRef.current = false
      attemptRef.current = data.attemptId
      answersRef.current = {}

      setAnswers({})
      setActiveIndex(0)
      setConfirmSubmit(false)

      setExam(data)

      const remaining = Math.max(
        0,
        Math.ceil(
          (
            new Date(data.expiresAt).getTime() -
            Date.now()
          ) / 1000
        )
      )

      setSecondsLeft(remaining)
      setStatus('active')
    } catch (error) {
      console.error('Exam start error:', error)

      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {})
      }

      setMessage(error.message)
      setStatus('ready')
    }
  }

  /* -----------------------------------------
     SAVE ANSWERS
  ----------------------------------------- */

  function selectAnswer(questionId, optionIndex) {
    if (status !== 'active' || doneRef.current) {
      return
    }

    const updatedAnswers = {
      ...answersRef.current,
      [questionId]: optionIndex,
    }

    answersRef.current = updatedAnswers
    setAnswers(updatedAnswers)

    fetch(`/api/quizzes/${id}/save`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attemptId: attemptRef.current,
        answers: updatedAnswers,
      }),
    })
      .then(response => {
        if (
          response.status === 409 &&
          !doneRef.current
        ) {
          void finish('TIME_LIMIT')
        }
      })
      .catch(error => {
        console.error('Answer autosave error:', error)
      })
  }

  /* -----------------------------------------
     COUNTDOWN TIMER
  ----------------------------------------- */

  useEffect(() => {
    if (status !== 'active' || !exam) {
      return
    }

    const expiresAt = new Date(
      exam.expiresAt
    ).getTime()

    function tick() {
      const seconds = Math.max(
        0,
        Math.ceil(
          (expiresAt - Date.now()) / 1000
        )
      )

      setSecondsLeft(seconds)

      if (seconds === 0) {
        void finish('TIME_LIMIT')
      }
    }

    tick()

    const interval = setInterval(
      tick,
      1000
    )

    return () => clearInterval(interval)
  }, [status, exam, finish])

  /* -----------------------------------------
     EXAM SECURITY
  ----------------------------------------- */

  useEffect(() => {
    if (status !== 'active') {
      return
    }

    let blurTimer = null

    function terminate(reason) {
      if (
        !doneRef.current &&
        attemptRef.current
      ) {
        void finish(reason)
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        terminate('TAB_HIDDEN')
      }
    }

    function onWindowBlur() {
      clearTimeout(blurTimer)

      blurTimer = setTimeout(() => {
        if (!document.hasFocus()) {
          terminate('WINDOW_BLUR')
        }
      }, 350)
    }

    function onWindowFocus() {
      clearTimeout(blurTimer)
    }

    function onFullscreenChange() {
      if (
        fullscreenRef.current &&
        !document.fullscreenElement
      ) {
        terminate('FULLSCREEN_EXIT')
      }
    }

    function onPageHide() {
      if (
        doneRef.current ||
        !attemptRef.current
      ) {
        return
      }

      doneRef.current = true

      const payload = JSON.stringify({
        attemptId: attemptRef.current,
        answers: answersRef.current,
        reason: 'PAGE_EXIT',
      })

      const blob = new Blob(
        [payload],
        { type: 'application/json' }
      )

      navigator.sendBeacon(
        `/api/quizzes/${id}/finish`,
        blob
      )
    }

    function preventCopy(event) {
      event.preventDefault()
    }

    function preventShortcuts(event) {
      const key = event.key.toLowerCase()

      if (
        (event.ctrlKey || event.metaKey) &&
        ['a', 'c', 'x', 's', 'p'].includes(key)
      ) {
        event.preventDefault()
      }
    }

    document.addEventListener(
      'visibilitychange',
      onVisibilityChange
    )

    document.addEventListener(
      'fullscreenchange',
      onFullscreenChange
    )

    document.addEventListener(
      'copy',
      preventCopy
    )

    document.addEventListener(
      'cut',
      preventCopy
    )

    document.addEventListener(
      'contextmenu',
      preventCopy
    )

    document.addEventListener(
      'keydown',
      preventShortcuts
    )

    window.addEventListener(
      'blur',
      onWindowBlur
    )

    window.addEventListener(
      'focus',
      onWindowFocus
    )

    window.addEventListener(
      'pagehide',
      onPageHide
    )

    return () => {
      clearTimeout(blurTimer)

      document.removeEventListener(
        'visibilitychange',
        onVisibilityChange
      )

      document.removeEventListener(
        'fullscreenchange',
        onFullscreenChange
      )

      document.removeEventListener(
        'copy',
        preventCopy
      )

      document.removeEventListener(
        'cut',
        preventCopy
      )

      document.removeEventListener(
        'contextmenu',
        preventCopy
      )

      document.removeEventListener(
        'keydown',
        preventShortcuts
      )

      window.removeEventListener(
        'blur',
        onWindowBlur
      )

      window.removeEventListener(
        'focus',
        onWindowFocus
      )

      window.removeEventListener(
        'pagehide',
        onPageHide
      )
    }
  }, [status, id, finish])

  /* -----------------------------------------
     EXAMINATION DATA
  ----------------------------------------- */

  const questions = exam?.questions || []
  const question = questions[activeIndex]

  const answeredCount = Object.keys(answers).length

  const minutes = String(
    Math.floor(secondsLeft / 60)
  ).padStart(2, '0')

  const seconds = String(
    secondsLeft % 60
  ).padStart(2, '0')

  const hasExplanationVideo = Boolean(exam?.hasExplanationVideo)

  /* -----------------------------------------
     RENDER
  ----------------------------------------- */

  return (
    <main className="ldce-exam-page">
      <div className="ldce-exam-container">
        <header className="ldce-exam-header">
          <div>
            <span className="ldce-exam-brand">
              LDCE WARRIORS
            </span>

            <h1>
              {exam?.title || 'Examination'}
            </h1>
          </div>

          {status === 'active' && (
            <div
              className={`ldce-exam-timer ${
                secondsLeft <= 60
                  ? 'ldce-exam-timer-warning'
                  : ''
              }`}
            >
              <FiClock size={19} />
              {minutes}:{seconds}
            </div>
          )}
        </header>

        {/* BEFORE START */}

      
{/* BEFORE START - GENERAL INSTRUCTIONS */}

{status === 'ready' && (
  <section className="ldce-instructions-page">

    <div className="ldce-instructions-heading">
      <span className="ldce-instructions-brand">
        LDCE WARRIORS
      </span>

      <h3 className="ldce-instructions-series">
        TEST SERIES
      </h3>

      <span className="ldce-instructions-label">
        BEFORE YOU BEGIN
      </span>

      <h2>General Instructions</h2>

      <p>
        Please read the following instructions carefully
      </p>
    </div>

    <div className="ldce-instructions-divider" />

    <div className="ldce-instructions-list">
      {[
        {
          number: '01',
          title: 'Read Carefully',
          description: 'Read each question carefully.',
        },
        {
          number: '02',
          title: 'Choose One Option',
          description: 'Select only one correct option.',
        },
        {
          number: '03',
          title: 'Review Your Answers',
          description:
            'Navigate and change answers before submission.',
        },
        {
          number: '04',
          title: 'Submit on Time',
          description:
            'Submit before time expires. Auto-submission applies.',
        },
        {
          number: '05',
          title: 'Check Your Performance',
          description:
            'Review your results and explanations after submission.',
        },
      ].map((item, index) => (
        <div
          key={item.number}
          className={`ldce-instruction-card ${
            index % 2 === 0
              ? 'ldce-instruction-blue'
              : 'ldce-instruction-pink'
          }`}
        >
          <div className="ldce-instruction-number">
            {item.number}
          </div>

          <div className="ldce-instruction-content">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        </div>
      ))}
    </div>

    {/* EXAM SECURITY NOTICE */}

    <div className="ldce-instruction-warning">
      <FiAlertCircle size={22} />

      <div>
        <strong>Important Examination Rules</strong>

        <p>
          Switching tabs, minimizing the window,
          leaving fullscreen mode or navigating away
          may terminate your examination.
        </p>
      </div>
    </div>

    {message && (
      <div
        className="ldce-instruction-error"
        role="alert"
      >
        <FiAlertCircle size={18} />
        <span>{message}</span>
      </div>
    )}

    {/* START EXAM BUTTON */}

    <button
      type="button"
      onClick={startExam}
      className="ldce-instructions-start"
    >
      Start Examination
      <FiArrowRight size={22} />
    </button>

    <Link
      href="/quiz"
      className="ldce-instructions-back"
    >
      ← Back to Quizzes
    </Link>
  </section>
)}


        {/* LOADING */}

        {status === 'loading' && (
          <section style={panel}>
            Starting your examination...
          </section>
        )}

        {/* ACTIVE EXAM */}

        {status === 'active' && question && (
          <div className="ldce-exam-grid">
            {/* LEFT SIDE - QUESTIONS */}

            <section className="ldce-question-panel">
              <div className="ldce-question-header">
                <strong>
                  Question {activeIndex + 1} of{' '}
                  {questions.length}
                </strong>

                <span>
                  {question.marks || 1} Marks
                </span>
              </div>

              <div className="ldce-question-progress">
                <div
                  style={{
                    width: `${
                      (
                        (activeIndex + 1) /
                        questions.length
                      ) * 100
                    }%`,
                  }}
                />
              </div>

              {/* OPTIONAL QUESTION IMAGE */}

              {question.imageUrl && (
                <img
                  key={question.id}
                  src={question.imageUrl}
                  alt={`Reference for question ${activeIndex + 1}`}
                  draggable={false}
                  onContextMenu={event =>
                    event.preventDefault()
                  }
                  className="ldce-question-image"
                />
              )}

              <h2 className="ldce-question-text">
                {question.text}
              </h2>

              {/* ANSWER OPTIONS */}

              <div className="ldce-answer-options">
                {question.options.map(
                  (option, optionIndex) => {
                    const selected =
                      answers[question.id] ===
                      optionIndex

                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        className={`ldce-answer-option ${
                          selected
                            ? 'ldce-answer-selected'
                            : ''
                        }`}
                        onClick={() =>
                          selectAnswer(
                            question.id,
                            optionIndex
                          )
                        }
                      >
                        <strong>
                          {String.fromCharCode(
                            65 + optionIndex
                          )}.
                        </strong>

                        <span>{option}</span>

                        {selected && (
                          <FiCheckCircle
                            size={19}
                            color={teal}
                            style={{
                              marginLeft: 'auto',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </button>
                    )
                  }
                )}
              </div>

              {/* PREVIOUS / NEXT */}

              <div className="ldce-question-navigation">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={activeIndex === 0}
                  onClick={() =>
                    setActiveIndex(index =>
                      Math.max(0, index - 1)
                    )
                  }
                >
                  Previous
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={
                    activeIndex ===
                    questions.length - 1
                  }
                  onClick={() =>
                    setActiveIndex(index =>
                      Math.min(
                        questions.length - 1,
                        index + 1
                      )
                    )
                  }
                >
                  Next
                </button>
              </div>
            </section>

            {/* RIGHT SIDE */}

            <div className="ldce-exam-sidebar">
              {/* QUESTION NAVIGATOR */}

              <aside className="ldce-navigator-card">
                <h3>Question Navigator</h3>

                <div className="ldce-question-numbers">
                  {questions.map((item, index) => {
                    const answered =
                      Object.prototype.hasOwnProperty.call(
                        answers,
                        item.id
                      )

                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={`ldce-question-number ${
                          answered
                            ? 'ldce-number-answered'
                            : ''
                        } ${
                          activeIndex === index
                            ? 'ldce-number-active'
                            : ''
                        }`}
                        onClick={() =>
                          setActiveIndex(index)
                        }
                      >
                        {index + 1}
                      </button>
                    )
                  })}
                </div>

                <p className="ldce-answered-count">
                  {answeredCount} / {questions.length}{' '}
                  Answered
                </p>

                {!confirmSubmit ? (
                  <button
                    type="button"
                    className="ldce-submit-button"
                    onClick={() =>
                      setConfirmSubmit(true)
                    }
                  >
                    Submit Exam
                  </button>
                ) : (
                  <div className="ldce-submit-confirmation">
                    <p>
                      Are you sure you want to submit
                      your examination?
                    </p>

                    <button
                      type="button"
                      className="ldce-submit-button"
                      onClick={() =>
                        void finish('USER_SUBMITTED')
                      }
                    >
                      Confirm Submit
                    </button>

                    <button
                      type="button"
                      className="ldce-cancel-button"
                      onClick={() =>
                        setConfirmSubmit(false)
                      }
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </aside>

              {/* LOCKED VIDEO PREVIEW BELOW NAVIGATOR */}

              <ExplanationVideoPreview
                available={hasExplanationVideo}
                thumbnailUrl={exam?.explanationThumbnailUrl || null}
              />
            </div>
          </div>
        )}

        {/* FINISHING */}

        {status === 'finishing' && (
          <section style={panel}>
            Finalizing examination...
          </section>
        )}

        {/* ENDED */}

        {status === 'ended' && (
          <section style={panel}>
            <h2 style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 15,
            }}>
              Exam Session Ended
            </h2>

            <p className="ldce-exam-error">
              <FiAlertCircle />
              {message}
            </p>

            <Link href="/quiz">
              Return to Quizzes
            </Link>
          </section>
        )}
      </div>

      {/* PAGE STYLES */}

      <style jsx global>{`
        .ldce-exam-page {
          min-height: 100vh;
          background: #F5F3EF;
          color: #1B2A4A;
          padding: 25px 16px 60px;
        }

        .ldce-exam-container {
          max-width: 1150px;
          margin: 0 auto;
        }

        .ldce-exam-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
        }

        .ldce-exam-brand {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: #D4922A;
          margin-bottom: 8px;
        }

        .ldce-exam-header h1 {
          font-size: 26px;
          font-weight: 800;
          line-height: 1.3;
        }

        .ldce-exam-timer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 13px 16px;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 13px;
          font-size: 23px;
          font-weight: 900;
          white-space: nowrap;
        }

        .ldce-exam-timer-warning {
          color: #B42318;
          border-color: #FECACA;
          background: #FFF1F1;
        }

        .ldce-exam-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: 18px;
          align-items: start;
        }

        .ldce-question-panel,
        .ldce-navigator-card,
        .ldce-explanation-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 21px;
        }

        .ldce-question-panel {
          min-width: 0;
          user-select: none;
          -webkit-user-select: none;
        }

        .ldce-question-header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .ldce-question-progress {
          width: 100%;
          height: 6px;
          background: #E5E7EB;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 26px;
        }

        .ldce-question-progress > div {
          height: 100%;
          background: #E8A838;
          transition: width .25s ease;
        }

        .ldce-question-image {
          display: block;
          width: 100%;
          max-height: 400px;
          object-fit: contain;
          background: #F5F3EF;
          border-radius: 12px;
          margin-bottom: 22px;
          pointer-events: none;
        }

        .ldce-question-text {
          font-size: 21px;
          font-weight: 600;
          line-height: 1.6;
          margin-bottom: 24px;
          overflow-wrap: anywhere;
        }

        .ldce-answer-options {
          display: grid;
          gap: 12px;
        }

        .ldce-answer-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          text-align: left;
          padding: 16px;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          background: white;
          color: #1B2A4A;
          font-size: 15px;
          cursor: pointer;
          transition:
            border-color .2s,
            background .2s;
        }

        .ldce-answer-option strong {
          flex-shrink: 0;
        }

        .ldce-answer-option:hover {
          border-color: #E8A838;
        }

        .ldce-answer-selected {
          background: #E9F7F5;
          border-color: #2A9D8F;
        }

        .ldce-question-navigation {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 28px;
        }

        .ldce-question-navigation button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .ldce-exam-sidebar {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }

        .ldce-navigator-card h3 {
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 17px;
        }

        .ldce-question-numbers {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .ldce-question-number {
          min-height: 41px;
          border-radius: 9px;
          border: 1px solid #E5E7EB;
          background: #F5F3EF;
          color: #1B2A4A;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .ldce-number-active {
          border: 2px solid #E8A838;
        }

        .ldce-number-answered {
          background: #2A9D8F;
          color: white;
          border-color: #2A9D8F;
        }

        .ldce-answered-count {
          color: #6B7280;
          font-size: 12px;
          margin: 20px 0;
        }

        .ldce-submit-button {
          width: 100%;
          background: #E8A838;
          color: #1B2A4A;
          padding: 14px 12px;
          border: 0;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .ldce-submit-button:hover,
        .ldce-start-button:hover {
          background: #D4922A;
        }

        .ldce-submit-confirmation {
          background: #FFF9EA;
          border-radius: 10px;
          padding: 12px;
        }

        .ldce-submit-confirmation p {
          font-size: 12px;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .ldce-cancel-button {
          display: block;
          margin: 12px auto 0;
          border: 0;
          background: transparent;
          color: #1B2A4A;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
        }

        /* EXPLANATION VIDEO CARD */

        .ldce-explanation-card {
          padding: 16px;
          box-shadow:
            0 3px 12px rgba(27, 42, 74, .04);
        }

        .ldce-explanation-card-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .ldce-explanation-heading-icon {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #FFF6DF;
          color: #D4922A;
          flex-shrink: 0;
        }

        .ldce-explanation-card-heading h3 {
          font-size: 15px;
          font-weight: 800;
        }

        .ldce-explanation-card-heading p {
          color: #6B7280;
          font-size: 10px;
          margin-top: 3px;
        }

        .ldce-explanation-thumbnail {
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: #1B2A4A;
          border-radius: 12px;
          user-select: none;
          -webkit-user-select: none;
        }

        .ldce-explanation-preview-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #111C34;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .ldce-explanation-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          height: 100%;
          padding: 12px;
          color: #E8A838;
          text-align: center;
        }

        .ldce-explanation-placeholder span {
          font-size: 12px;
          color: #FFFFFF;
          font-weight: 700;
        }

        .ldce-explanation-description {
          color: #6B7280;
          font-size: 11px;
          line-height: 1.7;
          margin-top: 14px;
        }

        .ldce-explanation-status {
          margin-top: 14px;
          padding: 10px 8px;
          background: #FFF6DF;
          border-radius: 9px;
          color: #9B690B;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 800;
          text-align: center;
        }

        /* INSTRUCTIONS */

        .ldce-instruction-title {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 15px;
        }

        .ldce-instruction-text {
          color: #4B5563;
          line-height: 1.85;
          margin-top: 10px;
          font-size: 14px;
        }

        .ldce-start-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: 25px;
          background: #E8A838;
          color: #1B2A4A;
          padding: 15px 25px;
          border: 0;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .ldce-exam-error {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #B42318;
          font-size: 14px;
          margin: 15px 0;
        }

        /* RESPONSIVE */

        @media (max-width: 800px) {
          .ldce-exam-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .ldce-exam-sidebar {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            align-items: start;
          }
        }

        @media (max-width: 600px) {
          .ldce-exam-page {
            padding: 20px 12px 45px;
          }

          .ldce-exam-header h1 {
            font-size: 20px;
          }

          .ldce-exam-timer {
            padding: 10px;
            font-size: 18px;
          }

          .ldce-exam-sidebar {
            display: flex;
            flex-direction: column;
          }

          .ldce-question-panel,
          .ldce-navigator-card,
          .ldce-explanation-card {
            padding: 16px;
          }

          .ldce-question-text {
            font-size: 18px;
          }

          .ldce-explanation-thumbnail {
            max-height: 220px;
          }
        }

/* EXAM GENERAL INSTRUCTIONS */

.ldce-instructions-page {
  width: 100%;
  max-width: 800px;
  margin: 25px auto 50px;
  padding: 30px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 22px;
}

.ldce-instructions-heading {
  text-align: center;
}

.ldce-instructions-brand {
  display: block;
  font-size: 19px;
  font-weight: 900;
  color: #8298B8;
  letter-spacing: 1px;
}

.ldce-instructions-series {
  margin-top: 10px;
  font-size: 25px;
  font-weight: 900;
  color: #3374C9;
  letter-spacing: 1px;
}

.ldce-instructions-label {
  display: inline-block;
  margin-top: 15px;
  padding: 7px 16px;
  border-radius: 25px;
  background: #E2F2FF;
  color: #145287;
  font-size: 13px;
  font-weight: 900;
}

.ldce-instructions-heading h2 {
  margin-top: 17px;
  font-size: clamp(28px, 4vw, 38px);
  font-weight: 900;
  color: #1B355C;
  line-height: 1.2;
}

.ldce-instructions-heading > p {
  margin-top: 15px;
  color: #667085;
  font-size: 15px;
  line-height: 1.6;
}

.ldce-instructions-divider {
  width: 100%;
  height: 1px;
  background: #DCE3EC;
  margin: 30px 0;
}

/* NUMBERED INSTRUCTION CARDS */

.ldce-instructions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ldce-instruction-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 19px;
  min-height: 115px;
  border-radius: 20px;
}

.ldce-instruction-blue {
  background: #EBF4FF;
}

.ldce-instruction-pink {
  background: #FFF0F5;
}

.ldce-instruction-number {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 78px;
  height: 78px;
  border-radius: 15px;
  font-size: 31px;
  font-weight: 900;
  color: #FFFFFF;
}

.ldce-instruction-blue .ldce-instruction-number {
  background: #246BB7;
}

.ldce-instruction-pink .ldce-instruction-number {
  background: #D82772;
}

.ldce-instruction-content {
  min-width: 0;
}

.ldce-instruction-content h3 {
  color: #111827;
  font-size: 22px;
  font-weight: 850;
  line-height: 1.3;
}

.ldce-instruction-content p {
  margin-top: 9px;
  color: #526070;
  font-size: 17px;
  line-height: 1.6;
}

/* EXAM SECURITY NOTICE */

.ldce-instruction-warning {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 18px;
  margin-top: 23px;
  border-radius: 15px;
  background: #FFF7E8;
  border: 1px solid #F4D49B;
  color: #8B5C0B;
}

.ldce-instruction-warning > svg {
  flex-shrink: 0;
}

.ldce-instruction-warning strong {
  display: block;
  font-size: 15px;
  font-weight: 850;
}

.ldce-instruction-warning p {
  margin-top: 7px;
  font-size: 13px;
  line-height: 1.7;
}

.ldce-instruction-error {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #B42318;
  margin-top: 18px;
  font-size: 14px;
}

/* START BUTTON */

.ldce-instructions-start {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  margin-top: 26px;
  padding: 17px 24px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    #246BB7,
    #114A90
  );
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 850;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s;
}

.ldce-instructions-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(36,107,183,.22);
}

.ldce-instructions-back {
  display: block;
  margin-top: 20px;
  text-align: center;
  color: #667085;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

/* MOBILE RESPONSIVE */

@media (max-width: 600px) {
  .ldce-instructions-page {
    margin: 15px auto 35px;
    padding: 18px 14px 24px;
    border-radius: 16px;
  }

  .ldce-instructions-brand {
    font-size: 17px;
  }

  .ldce-instructions-series {
    font-size: 22px;
  }

  .ldce-instructions-heading h2 {
    font-size: 30px;
  }

  .ldce-instructions-heading > p {
    font-size: 13px;
  }

  .ldce-instruction-card {
    gap: 14px;
    padding: 14px;
    min-height: 104px;
    border-radius: 17px;
  }

  .ldce-instruction-number {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    font-size: 26px;
  }

  .ldce-instruction-content h3 {
    font-size: 17px;
  }

  .ldce-instruction-content p {
    font-size: 14px;
    margin-top: 6px;
  }

  .ldce-instructions-start {
    font-size: 16px;
  }
}

      `}</style>
    </main>
  )
}
