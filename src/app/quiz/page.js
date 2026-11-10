'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { textbookStyles } from '@/components/materials/TextbookCard'
import TopicCardGrid, { plural } from '@/components/topics/TopicCardGrid'

export default function QuizPage() {
  const [topics, setTopics] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadTopics() {
      try {
        const [topicRes, quizRes] = await Promise.all([
          fetch('/api/admin/topics'),
          fetch('/api/quizzes', { cache: 'no-store' }),
        ])
        const [topicData, quizData] = await Promise.all([topicRes.json(), quizRes.json()])

        if (!topicRes.ok || !topicData.success) throw new Error('Unable to load topics')
        if (!quizRes.ok || !quizData.success) throw new Error('Unable to load tests')

        const quizCounts = {}
        for (const quiz of quizData.quizzes || []) {
          if (quiz.mode === 'TOPIC' && quiz.topicId) {
            quizCounts[quiz.topicId] = (quizCounts[quiz.topicId] || 0) + 1
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
    return () => { cancelled = true }
  }, [])

  const q = search.trim().toLowerCase()
  const items = topics
    .filter(t => !q || t.name.toLowerCase().includes(q))
    .map(t => {
      const id = t.id || t._id
      const n = counts[id] || 0
      return {
        id,
        name: t.name,
        thumbnail: t.thumbnail,
        href: `/quiz/topic/${id}`,
        countLabel: n ? `📝 ${plural(n, 'Test')}` : '',
      }
    })

  return (
    <>
      <Navbar />
      <main className="mat-page">
        <header className="mat-hero">
          <h1>Mock Tests</h1>
          <p>Choose a topic to practise its tests.</p>
        </header>

        {topics.length > 6 && (
          <div className="tp-search">
            <input
              type="search"
              placeholder="Search topics…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {error ? (
          <p className="mat-empty">{error}</p>
        ) : !loading && items.length === 0 ? (
          <p className="mat-empty">{topics.length ? 'No topics match your search.' : 'Tests are coming soon. Stay tuned!'}</p>
        ) : (
          <TopicCardGrid items={items} loading={loading} buttonLabel="Start Practicing →" />
        )}
      </main>
      <Footer />

      <style>{`
        ${textbookStyles}
        .tp-search { max-width:420px; margin:0 auto 24px; }
        .tp-search input { width:100%; padding:11px 16px; border:1px solid #E5E7EB; border-radius:12px; font-size:14px; background:#fff; outline:none; }
        .tp-search input:focus { border-color:#E8A838; }
      `}</style>
    </>
  )
}
