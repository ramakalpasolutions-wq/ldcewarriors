'use client'

import { useCallback, useEffect, useState } from 'react'

/*
  Shared "pick a topic first" layout for the admin Videos,
  Quizzes and Digital Textbook pages.

  - useAdminTopic(): selected topic id, kept in the URL (?topic=…)
    so a page refresh stays on the same topic.
  - <AdminTopicGrid>: grid of topics with item counts.
  - <AdminTopicBar>: header shown once a topic is chosen.
*/

export function useAdminTopic() {
  const [topic, setTopicState] = useState(null)

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('topic')
    if (fromUrl) setTopicState(fromUrl)
  }, [])

  const setTopic = useCallback(next => {
    setTopicState(next)
    const url = new URL(window.location.href)
    if (next) url.searchParams.set('topic', next)
    else url.searchParams.delete('topic')
    window.history.replaceState(null, '', url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return [topic, setTopic]
}

// Sort by order number (1, 2, 3…); items without a number go last.
export function byOrderNumber(getOrder = x => x.order) {
  return (a, b) => {
    const ao = Number(getOrder(a)) > 0 ? Number(getOrder(a)) : Infinity
    const bo = Number(getOrder(b)) > 0 ? Number(getOrder(b)) : Infinity
    if (ao !== bo) return ao - bo
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  }
}

export default function AdminTopicGrid({
  topics = [],
  counts = {},
  extraTiles = [],
  unit = 'items',
  loading = false,
  onSelect,
}) {
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()

  const tiles = [
    ...topics.map(t => ({
      id: t._id || t.id,
      name: t.name,
      thumbnail: t.thumbnail,
    })),
    // e.g. "No topic" / "Full Mock Tests" — only shown when they have items
    ...extraTiles.filter(t => (counts[t.id] || 0) > 0),
  ].filter(t => !q || t.name.toLowerCase().includes(q))

  return (
    <div className="atg">
      <div className="atg-head">
        <div>
          <h2>Choose a topic</h2>
          <p>Pick a topic to see, add and order its {unit}.</p>
        </div>
        {topics.length > 6 && (
          <input
            type="search"
            className="adm-input atg-search"
            placeholder="Search topics…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        )}
      </div>

      {loading ? (
        <div className="atg-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="atg-card atg-skel" />)}
        </div>
      ) : tiles.length === 0 ? (
        <p className="atg-empty">{q ? 'No topics match your search.' : 'No topics yet — add one under Topics.'}</p>
      ) : (
        <div className="atg-grid">
          {tiles.map(tile => {
            const n = counts[tile.id] || 0
            return (
              <button key={tile.id} type="button" className="atg-card" onClick={() => onSelect(tile.id)}>
                <div className="atg-thumb">
                  {tile.thumbnail ? (
                    <img src={tile.thumbnail} alt="" loading="lazy" />
                  ) : (
                    <span>{tile.icon || tile.name.charAt(0)}</span>
                  )}
                </div>
                <div className="atg-body">
                  <strong>{tile.name}</strong>
                  <span className={n ? 'atg-count' : 'atg-count atg-zero'}>
                    {n} {n === 1 ? unit.replace(/s$/, '') : unit}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <style>{`
        .atg { display:flex; flex-direction:column; gap:14px; }
        .atg-head { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; flex-wrap:wrap; }
        .atg-head h2 { font-size:16px; font-weight:800; color:#1B2A4A; margin:0; }
        .atg-head p { font-size:12px; color:#6B7280; margin:2px 0 0; }
        .atg-search { width:220px !important; }
        .atg-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:12px; }
        .atg-card {
          display:flex; flex-direction:column; text-align:left; padding:8px; cursor:pointer; font-family:inherit;
          background:#fff; border:1.5px solid #E5E7EB; border-radius:14px;
          transition:transform .2s ease, border-color .2s ease, box-shadow .2s ease;
        }
        .atg-card:hover { transform:translateY(-2px); border-color:#E8A838; box-shadow:0 8px 20px rgba(27,42,74,.08); }
        .atg-skel { height:150px; background:linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
        .atg-thumb { aspect-ratio:16/9; border-radius:10px; overflow:hidden; background:linear-gradient(135deg,#EEF0F5,#F7F5FF); display:flex; align-items:center; justify-content:center; }
        .atg-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .atg-thumb span { font-size:30px; font-weight:900; color:#1B2A4A; opacity:.6; }
        .atg-body { padding:9px 4px 3px; display:flex; flex-direction:column; gap:3px; }
        .atg-body strong { font-size:13px; color:#1A1D23; line-height:1.3; }
        .atg-count { font-size:11px; font-weight:700; color:#2A9D8F; }
        .atg-zero { color:#9CA3AF; }
        .atg-empty { text-align:center; color:#6B7280; padding:30px 0; font-size:13px; }
        @media (max-width:640px) {
          .atg-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
          .atg-search { width:100% !important; }
        }
      `}</style>
    </div>
  )
}

export function AdminTopicBar({ topic, count, unit = 'items', onBack, children }) {
  return (
    <div className="atb">
      <button type="button" className="atb-back" onClick={onBack}>← All topics</button>
      <div className="atb-main">
        {topic?.thumbnail ? (
          <img src={topic.thumbnail} alt="" className="atb-thumb" />
        ) : (
          <span className="atb-thumb atb-thumb-ph">{topic?.icon || topic?.name?.charAt(0) || '•'}</span>
        )}
        <div className="atb-text">
          <strong>{topic?.name || 'Topic'}</strong>
          <span>{count} {count === 1 ? unit.replace(/s$/, '') : unit}</span>
        </div>
        <div className="atb-actions">{children}</div>
      </div>

      <style>{`
        .atb { display:flex; flex-direction:column; gap:8px; }
        .atb-back { align-self:flex-start; background:none; border:0; padding:0; color:#6B7280; font-weight:700; font-size:12px; cursor:pointer; font-family:inherit; }
        .atb-back:hover { color:#1B2A4A; }
        .atb-main { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:14px; background:linear-gradient(135deg,#1B2A4A,#243656); color:#fff; flex-wrap:wrap; }
        .atb-thumb { width:64px; height:40px; border-radius:8px; object-fit:cover; flex-shrink:0; }
        .atb-thumb-ph { display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.12); font-weight:900; }
        .atb-text { flex:1; min-width:120px; display:flex; flex-direction:column; }
        .atb-text strong { font-size:16px; }
        .atb-text span { font-size:12px; color:rgba(255,255,255,.6); }
        .atb-actions { display:flex; gap:8px; flex-wrap:wrap; }
      `}</style>
    </div>
  )
}
