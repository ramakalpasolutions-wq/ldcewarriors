'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { textbookStyles } from '@/components/materials/TextbookCard'

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

        {loading ? (
          <div className="tp-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="tp-card mat-skeleton" style={{ height: 240 }} />)}
          </div>
        ) : error ? (
          <p className="mat-empty">{error}</p>
        ) : visible.length === 0 ? (
          <p className="mat-empty">{topics.length ? 'No topics match your search.' : 'Textbooks are coming soon. Stay tuned!'}</p>
        ) : (
          <div className="tp-grid">
            {visible.map(topic => (
              <Link key={topic.id} href={`/materials/topic/${topic.id}`} className="tp-card">
                <div className="tp-thumb">
                  {topic.thumbnail ? (
                    <img src={topic.thumbnail} alt={topic.name} loading="lazy" />
                  ) : (
                    <span className="tp-initial">{topic.name.charAt(0)}</span>
                  )}
                </div>
                <div className="tp-body">
                  <h3>{topic.name}</h3>
                  <span className={topic.count ? 'tp-count' : 'tp-count tp-soon'}>
                    {topic.count
                      ? `📘 ${topic.count} ${topic.count === 1 ? 'Textbook' : 'Textbooks'}`
                      : 'Coming soon'}
                  </span>
                  <span className="tp-open">View Textbooks →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <style>{`
        ${textbookStyles}

        .tp-search { max-width:420px; margin:0 auto 24px; }
        .tp-search input { width:100%; padding:11px 16px; border:1px solid #E5E7EB; border-radius:12px; font-size:14px; background:#fff; outline:none; }
        .tp-search input:focus { border-color:#E8A838; }

        .tp-grid { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:20px; }
        .tp-card {
          display:flex; flex-direction:column; background:#fff; border:1px solid #E5E7EB; border-radius:16px;
          padding:12px; text-decoration:none; transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }
        .tp-card:hover { transform:translateY(-3px); border-color:#E8A838; box-shadow:0 10px 25px rgba(27,42,74,.1); }
        .tp-thumb { aspect-ratio:16/9; border-radius:12px; overflow:hidden; background:linear-gradient(135deg,#EDE9FE,#F7F5FF); display:flex; align-items:center; justify-content:center; }
        .tp-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .tp-initial { font-size:48px; font-weight:900; color:#7C3AED; }
        .tp-body { padding:14px 6px 6px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:8px; flex:1; }
        .tp-body h3 { font-family:'Playfair Display', serif; color:#C8102E; font-size:19px; font-weight:800; margin:0; }
        .tp-count { font-size:13px; font-weight:700; color:#1238B4; }
        .tp-soon { color:#9CA3AF; }
        .tp-open { margin-top:auto; background:#E8A838; color:#1B2A4A; padding:9px 18px; border-radius:10px; font-size:13px; font-weight:800; transition:background .2s ease; }
        .tp-card:hover .tp-open { background:#D4922A; }

        @media (max-width: 600px) {
          .tp-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
          .tp-body h3 { font-size:16px; }
          .tp-open { padding:8px 12px; font-size:12px; }
        }
      `}</style>
    </>
  )
}
