
'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import toast from 'react-hot-toast'
import { uploadQuizMedia } from '@/lib/quizUpload'

const navy = '#1B2A4A'
const gold = '#E8A838'

const input = {
  width: '100%',
  padding: '12px',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  background: '#FFFFFF',
  color: navy,
  marginTop: 5,
}

const card = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  padding: 22,
}

const button = {
  padding: '12px 20px',
  borderRadius: 10,
  background: navy,
  color: '#FFFFFF',
  fontWeight: 700,
  border: 0,
  cursor: 'pointer',
}

function blankQuiz() {
  return {
    title: '',
    description: '',
    mode: 'TOPIC',
    topicId: '',
    durationMinutes: 20,
    accessType: 'FREE',
    explanationVideoKey: '',
    explanationVideoName: '',
    explanationThumbnailKey: '',
    isPublished: false,
    questions: [],
  }
}

function blankQuestion() {
  return {
    id: crypto.randomUUID(),
    text: '',
    imageKey: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    marks: 1,
    explanation: '',
  }
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState([])
  const [topics, setTopics] = useState([])

  const [form, setForm] = useState(blankQuiz)
  const [editingId, setEditingId] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [videoUploading, setVideoUploading] =
    useState(false)

  const [videoProgress, setVideoProgress] =
    useState(0)

  const [imageUploading, setImageUploading] =
    useState(null)

  const [imageProgress, setImageProgress] =
    useState(0)

  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [thumbnailProgress, setThumbnailProgress] = useState(0)

  const busy =
    saving || videoUploading || thumbnailUploading || imageUploading !== null

  const loadData = useCallback(async () => {
    try {
      const [quizRes, topicsRes] = await Promise.all([
        fetch('/api/admin/quizzes'),
        fetch('/api/admin/topics'),
      ])

      const [quizData, topicsData] =
        await Promise.all([
          quizRes.json(),
          topicsRes.json(),
        ])

      if (!quizRes.ok) {
        throw new Error(
          quizData.error || 'Failed to load quizzes'
        )
      }

      setQuizzes(quizData.quizzes || [])

      if (topicsData.success) {
        setTopics(topicsData.topics || [])
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function updateField(name, value) {
    setForm(old => ({
      ...old,
      [name]: value,
    }))
  }

  function updateQuestion(id, changes) {
    setForm(old => ({
      ...old,
      questions: old.questions.map(q =>
        q.id === id
          ? { ...q, ...changes }
          : q
      ),
    }))
  }

  function updateOption(id, index, value) {
    setForm(old => ({
      ...old,
      questions: old.questions.map(q =>
        q.id === id
          ? {
              ...q,
              options: q.options.map((option, i) =>
                i === index ? value : option
              ),
            }
          : q
      ),
    }))
  }

  function resetForm() {
    setEditingId(null)
    setForm(blankQuiz())
    setFormOpen(false)
    setVideoProgress(0)
    setThumbnailProgress(0)
  }

  function editQuiz(quiz) {
    setEditingId(quiz.id)

    setForm({
      title: quiz.title || '',
      description: quiz.description || '',
      mode: quiz.mode || 'TOPIC',
      topicId: quiz.topicId || '',
      durationMinutes: quiz.durationMinutes || 20,
      accessType: quiz.accessType || 'FREE',
      explanationVideoKey:
        quiz.explanationVideoKey || '',
      explanationVideoName:
        quiz.explanationVideoName || '',
      explanationThumbnailKey: quiz.explanationThumbnailKey || '',
      isPublished: Boolean(quiz.isPublished),
      questions: Array.isArray(quiz.questions)
        ? quiz.questions
        : [],
    })

    setFormOpen(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function uploadImage(questionId, file) {
    if (!file) return

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp',
      ].includes(file.type)
    ) {
      toast.error('Use JPG, PNG or WebP images')
      return
    }

    if (
      file.size < 1 ||
      file.size > 5 * 1024 * 1024
    ) {
      toast.error('Maximum image size is 5 MB')
      return
    }

    setImageUploading(questionId)
    setImageProgress(0)

    try {
      const result = await uploadQuizMedia(
        file,
        'quiz-questions',
        setImageProgress
      )

      updateQuestion(questionId, {
        imageKey: result.key,
      })

      toast.success('Question image uploaded')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setImageUploading(null)
    }
  }


async function uploadVideo(file) {
  if (!file) return

  if (
    !['video/mp4', 'video/webm'].includes(file.type)
  ) {
    toast.error('Use MP4 or WebM videos')
    return
  }

  if (file.size <= 0) {
    toast.error('The selected video is empty')
    return
  }

  setVideoUploading(true)
  setVideoProgress(0)

  try {
    const result = await uploadQuizMedia(
      file,
      'quiz-explanations',
      setVideoProgress
    )

    setForm(previous => ({
      ...previous,
      explanationVideoKey: result.key,
      explanationVideoName: result.name,
    }))

    toast.success('Explanation video uploaded to R2')
  } catch (error) {
    toast.error(error.message)
  } finally {
    setVideoUploading(false)
  }
}



  async function uploadExplanationThumbnail(file) {
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Use JPG, PNG or WebP images')
      return
    }

    if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
      toast.error('Maximum thumbnail size is 5 MB')
      return
    }

    setThumbnailUploading(true)
    setThumbnailProgress(0)

    try {
      const uploaded = await uploadQuizMedia(
        file,
        'quiz-questions',
        setThumbnailProgress
      )

      setForm(previous => ({
        ...previous,
        explanationThumbnailKey: uploaded.key,
      }))

      toast.success('Explanation thumbnail uploaded to R2')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setThumbnailUploading(false)
    }
  }

  async function saveQuiz(event) {
    event.preventDefault()

    if (busy) return

    setSaving(true)

    try {
      const response = await fetch(
        '/api/admin/quizzes',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...form,
            id: editingId || undefined,
            topicId:
              form.mode === 'MOCK'
                ? null
                : form.topicId,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || 'Failed to save quiz'
        )
      }

      toast.success(
        editingId
          ? 'Quiz updated successfully'
          : 'Quiz created successfully'
      )

      resetForm()
      await loadData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function archiveQuiz(id) {
    if (!window.confirm('Archive this quiz?')) return

    try {
      const res = await fetch(
        `/api/admin/quizzes?id=${id}`,
        { method: 'DELETE' }
      )

      const result = await res.json()

      if (!res.ok) {
        throw new Error(
          result.error || 'Archive failed'
        )
      }

      toast.success('Quiz archived')
      await loadData()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <main
      style={{
        maxWidth: 1350,
        margin: '0 auto',
        padding: '28px 20px',
        color: navy,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
          marginBottom: 25,
        }}
      >
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800 }}>
            Quiz Management
          </h1>

          <p style={{ color: '#6B7280' }}>
            Add questions, diagrams and explanation videos.
          </p>
        </div>

        <button
          style={button}
          disabled={busy}
          onClick={() => {
            resetForm()
            setFormOpen(true)
          }}
        >
          + Create Quiz
        </button>
      </header>

      {formOpen && (
        <form
          onSubmit={saveQuiz}
          style={{
            ...card,
            marginBottom: 30,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 20,
            }}
          >
            {editingId ? 'Edit Quiz' : 'Create New Quiz'}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(220px,1fr))',
              gap: 15,
            }}
          >
            <label>
              Quiz Title *
              <input
                required
                style={input}
                value={form.title}
                onChange={e =>
                  updateField('title', e.target.value)
                }
              />
            </label>

            <label>
              Quiz Type
              <select
                style={input}
                value={form.mode}
                onChange={e =>
                  updateField('mode', e.target.value)
                }
              >
                <option value="TOPIC">Topic Quiz</option>
                <option value="MOCK">Full Mock Test</option>
              </select>
            </label>

            {form.mode === 'TOPIC' && (
              <label>
                Existing Topic *
                <select
                  required
                  style={input}
                  value={form.topicId}
                  onChange={e =>
                    updateField(
                      'topicId',
                      e.target.value
                    )
                  }
                >
                  <option value="">Select Topic</option>

                  {topics.map(topic => (
                    <option
                      key={topic.id || topic._id}
                      value={topic.id || topic._id}
                    >
                      {topic.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Duration (Minutes)
              <input
                required
                type="number"
                min="1"
                max="240"
                style={input}
                value={form.durationMinutes}
                onChange={e =>
                  updateField(
                    'durationMinutes',
                    Number(e.target.value)
                  )
                }
              />
            </label>

            <label>
              Access
              <select
                style={input}
                value={form.accessType}
                onChange={e =>
                  updateField(
                    'accessType',
                    e.target.value
                  )
                }
              >
                <option value="FREE">Free</option>
                <option value="PREMIUM">
                  Join Family Only
                </option>
              </select>
            </label>
          </div>

          <label
            style={{
              display: 'block',
              marginTop: 16,
            }}
          >
            Description
            <textarea
              style={input}
              rows={2}
              value={form.description}
              onChange={e =>
                updateField(
                  'description',
                  e.target.value
                )
              }
            />
          </label>

          {/* Fresh R2 explanation video */}
          <section
            style={{
              background: '#FFF9EB',
              border: '1px solid #E8D6A7',
              borderRadius: 14,
              padding: 20,
              marginTop: 24,
            }}
          >
            <h3 style={{
              fontSize: 18,
              fontWeight: 800,
            }}>
              Explanation Video
            </h3>

            <p style={{
              color: '#6B7280',
              fontSize: 13,
              margin: '8px 0 15px',
            }}>
              Upload an MP4 or WebM explanation video directly to
Cloudflare R2. Large videos use multipart upload.
            </p>

            <input
              type="file"
              accept="video/mp4,video/webm"
              disabled={busy}
              onChange={e => {
                uploadVideo(e.target.files?.[0])
                e.target.value = ''
              }}
            />

            {videoUploading && (
              <div style={{ marginTop: 15 }}>
                <progress
                  value={videoProgress}
                  max={100}
                  style={{ width: '100%' }}
                />

                <p>
                  Uploading: {videoProgress}%
                </p>
              </div>
            )}

            {form.explanationVideoKey && (
              <div style={{
                marginTop: 15,
                color: '#21867A',
              }}>
                <strong>
                  ✓ {form.explanationVideoName}
                </strong>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setForm(old => ({
                      ...old,
                      explanationVideoKey: '',
                      explanationVideoName: '',
                    }))
                  }
                  style={{
                    marginLeft: 14,
                    color: '#B42318',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </section>

          {/* Explanation thumbnail: private Cloudflare R2 image */}
          <section
            style={{
              background: '#F8FAFC',
              border: '1px solid #E5E7EB',
              borderRadius: 14,
              padding: 20,
              marginTop: 18,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>
              Explanation Video Thumbnail
            </h3>
            <p style={{ color: '#6B7280', fontSize: 13, margin: '8px 0 15px' }}>
              Upload the static image shown below Question Navigator during the exam.
              The actual video remains unavailable until submission.
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={event => {
                void uploadExplanationThumbnail(event.target.files?.[0])
                event.target.value = ''
              }}
            />

            {thumbnailUploading && (
              <div style={{ marginTop: 15 }}>
                <progress value={thumbnailProgress} max={100} style={{ width: '100%' }} />
                <p style={{ fontSize: 13 }}>Uploading: {thumbnailProgress}%</p>
              </div>
            )}

            {form.explanationThumbnailKey && (
              <div style={{ marginTop: 16 }}>
                <img
                  src={`/api/admin/quizzes/media?key=${encodeURIComponent(form.explanationThumbnailKey)}`}
                  alt="Explanation video thumbnail"
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: 420,
                    aspectRatio: '16 / 9',
                    objectFit: 'contain',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    background: '#FFFFFF',
                  }}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateField('explanationThumbnailKey', '')}
                  style={{ color: '#B42318', fontWeight: 700, marginTop: 12 }}
                >
                  Remove Thumbnail
                </button>
              </div>
            )}
          </section>

          {/* Questions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 15,
              margin: '30px 0 20px',
            }}
          >
            <h3 style={{
              fontSize: 22,
              fontWeight: 800,
            }}>
              Questions ({form.questions.length})
            </h3>

            <button
              type="button"
              disabled={busy}
              style={{
                ...button,
                background: gold,
                color: navy,
              }}
              onClick={() =>
                updateField('questions', [
                  ...form.questions,
                  blankQuestion(),
                ])
              }
            >
              + Add Question
            </button>
          </div>

          {form.questions.map((question, index) => (
            <section
              key={question.id}
              style={{
                ...card,
                background: '#FAFBFD',
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 15,
                  marginBottom: 15,
                }}
              >
                <strong>
                  Question {index + 1}
                </strong>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    updateField(
                      'questions',
                      form.questions.filter(
                        q => q.id !== question.id
                      )
                    )
                  }
                  style={{
                    color: '#B42318',
                    cursor: 'pointer',
                  }}
                >
                  Remove Question
                </button>
              </div>

              <label>
                Question Text *
                <textarea
                  required
                  rows={3}
                  style={input}
                  value={question.text}
                  onChange={e =>
                    updateQuestion(
                      question.id,
                      { text: e.target.value }
                    )
                  }
                  placeholder="Identify the component shown..."
                />
              </label>

              <div style={{ margin: '18px 0' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 700,
                }}>
                  Question Image (Optional)
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  style={{ marginTop: 10 }}
                  onChange={e => {
                    uploadImage(
                      question.id,
                      e.target.files?.[0]
                    )
                    e.target.value = ''
                  }}
                />

                {imageUploading === question.id && (
                  <div style={{ marginTop: 10 }}>
                    <progress
                      value={imageProgress}
                      max={100}
                      style={{ width: '100%' }}
                    />
                    <p>{imageProgress}%</p>
                  </div>
                )}

                {question.imageKey && (
                  <div style={{ marginTop: 15 }}>
                    <img
                      key={question.imageKey}
                      src={
                        `/api/admin/quizzes/media?key=${encodeURIComponent(question.imageKey)}`
                      }
                      alt={`Question ${index + 1}`}
                      style={{
                        maxWidth: 450,
                        width: '100%',
                        maxHeight: 300,
                        objectFit: 'contain',
                        borderRadius: 12,
                        border: '1px solid #E5E7EB',
                      }}
                    />

                    <div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          updateQuestion(
                            question.id,
                            { imageKey: '' }
                          )
                        }
                        style={{
                          color: '#B42318',
                          marginTop: 10,
                        }}
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(210px,1fr))',
                  gap: 12,
                }}
              >
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex}>
                    Option {String.fromCharCode(65 + optionIndex)}
                    <input
                      required
                      style={input}
                      value={option}
                      onChange={e =>
                        updateOption(
                          question.id,
                          optionIndex,
                          e.target.value
                        )
                      }
                    />
                  </label>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(210px,1fr))',
                  gap: 12,
                  marginTop: 16,
                }}
              >
                <label>
                  Correct Answer
                  <select
                    style={input}
                    value={question.correctIndex}
                    onChange={e =>
                      updateQuestion(question.id, {
                        correctIndex: Number(
                          e.target.value
                        ),
                      })
                    }
                  >
                    {question.options.map((_, i) => (
                      <option key={i} value={i}>
                        Option {String.fromCharCode(65 + i)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Marks
                  <input
                    required
                    type="number"
                    min="1"
                    max="20"
                    style={input}
                    value={question.marks}
                    onChange={e =>
                      updateQuestion(question.id, {
                        marks: Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>

              <label style={{
                display: 'block',
                marginTop: 15,
              }}>
                Answer Explanation
                <textarea
                  rows={2}
                  style={input}
                  value={question.explanation}
                  onChange={e =>
                    updateQuestion(question.id, {
                      explanation: e.target.value,
                    })
                  }
                />
              </label>
            </section>
          ))}

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 22,
              fontWeight: 700,
            }}
          >
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={e =>
                updateField(
                  'isPublished',
                  e.target.checked
                )
              }
            />

            Publish Quiz
          </label>

          <div style={{
            display: 'flex',
            gap: 12,
            marginTop: 25,
          }}>
            <button
              type="submit"
              disabled={busy}
              style={button}
            >
              {saving ? 'Saving...' : 'Save Quiz'}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={resetForm}
              style={{
                ...button,
                background: '#E5E7EB',
                color: navy,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading quizzes...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(280px,1fr))',
            gap: 18,
          }}
        >
          {quizzes.map(quiz => (
            <article
              key={quiz.id}
              style={card}
            >
              <span style={{
                color: '#2A9D8F',
                fontSize: 12,
                fontWeight: 800,
              }}>
                {quiz.mode === 'MOCK'
                  ? 'FULL MOCK TEST'
                  : quiz.topic?.name || 'TOPIC QUIZ'}
              </span>

              <h3 style={{
                fontSize: 21,
                fontWeight: 800,
                margin: '12px 0',
              }}>
                {quiz.title}
              </h3>

              <p style={{
                color: '#6B7280',
                fontSize: 13,
                marginBottom: 8,
              }}>
                {quiz.questions?.length || 0} Questions
                {' · '}
                {quiz.durationMinutes} Minutes
              </p>

              <p style={{
                fontSize: 13,
                color: quiz.isPublished
                  ? '#21867A'
                  : '#D4922A',
              }}>
                {quiz.isPublished
                  ? 'Published'
                  : 'Draft'}
              </p>

              <p style={{
                color: '#6B7280',
                fontSize: 12,
                marginTop: 8,
              }}>
                Video: {quiz.explanationVideoName || 'Not uploaded'}
              </p>

              <div style={{
                display: 'flex',
                gap: 10,
                marginTop: 20,
              }}>
                <button
                  style={button}
                  onClick={() => editQuiz(quiz)}
                >
                  Edit
                </button>

                <button
                  style={{
                    ...button,
                    background: '#FEE8E7',
                    color: '#B42318',
                  }}
                  onClick={() =>
                    archiveQuiz(quiz.id)
                  }
                >
                  Archive
                </button>
              </div>
            </article>
          ))}

          {quizzes.length === 0 && (
            <p>No quizzes created yet.</p>
          )}
        </div>
      )}
    </main>
  )
}
