'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { textbookStyles } from '@/components/materials/TextbookCard'
import TopicCardGrid, { plural } from '@/components/topics/TopicCardGrid'

export default function ClassesTopicsPage() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/topics', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (!data.success) throw new Error(data.error)
        setTopics(data.topics || [])
      })
      .catch(() => !cancelled && setError('Unable to load topics right now.'))
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
          <h1>In-Depth Technical Classes</h1>
          <p>Choose a topic to watch its video lessons.</p>
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
          <p className="mat-empty">{topics.length ? 'No topics match your search.' : 'Classes are coming soon. Stay tuned!'}</p>
        ) : (
          <TopicCardGrid
            loading={loading}
            buttonLabel="Watch Classes →"
            items={visible.map(topic => {
              const id = topic._id || topic.id
              const total = topic.videoCount || 0
              const free = topic.freeVideoCount || 0
              return {
                id,
                name: topic.name,
                thumbnail: topic.thumbnail,
                href: `/classes?topic=${id}`,
                countLabel: total ? `🎬 ${plural(total, 'Video')}${free ? ` · ${free} free` : ''}` : '',
              }
            })}
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
