'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { textbookStyles } from '@/components/materials/TextbookCard'
import TopicCardGrid, { plural } from '@/components/topics/TopicCardGrid'

export default function MaterialsTopicsPage() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/materials')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (!data.success) throw new Error(data.error)
        setTopics(data.topics)
      })
      .catch(() => !cancelled && setError('Unable to load textbooks right now.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  const q = search.trim().toLowerCase()
  const visible = topics.filter(t => !q || t.name.toLowerCase().includes(q))

  return (
    <>
      <Navbar />
      <main className="mat-page">
        <header className="mat-hero">
          <h1>Digital Textbook</h1>
          <p>Choose a topic to see its chapter-wise textbooks.</p>
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
        ) : !loading && visible.length === 0 ? (
          <p className="mat-empty">{topics.length ? 'No topics match your search.' : 'Textbooks are coming soon. Stay tuned!'}</p>
        ) : (
          <TopicCardGrid
            loading={loading}
            buttonLabel="View Textbooks →"
            items={visible.map(t => ({
              id: t.id,
              name: t.name,
              thumbnail: t.thumbnail,
              href: `/materials/topic/${t.id}`,
              countLabel: t.count ? `📘 ${plural(t.count, 'Textbook')}` : '',
            }))}
          />
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
