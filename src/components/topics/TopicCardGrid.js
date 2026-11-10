import Link from 'next/link'

/*
  Topic cards in the Digital Textbook design, shared by
  Digital Textbook, Classes, Mock Tests and the home page.

  items: [{ id, name, thumbnail, href, countLabel }]
  countLabel: e.g. "📘 2 Textbooks" — leave empty to show "Coming soon"
*/
export default function TopicCardGrid({ items = [], buttonLabel = 'View →', loading = false }) {
  if (loading) {
    return (
      <div className="tp-grid">
        {[1, 2, 3, 4].map(i => <div key={i} className="tp-card tp-skeleton" />)}
        <style>{topicCardStyles}</style>
      </div>
    )
  }

  return (
    <div className="tp-grid">
      {items.map(item => (
        <Link key={item.id} href={item.href} className="tp-card">
          <div className="tp-thumb">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.name} loading="lazy" />
            ) : (
              <span className="tp-initial">{item.name?.charAt(0)}</span>
            )}
          </div>
          <div className="tp-body">
            <h3>{item.name}</h3>
            <span className={item.countLabel ? 'tp-count' : 'tp-count tp-soon'}>
              {item.countLabel || 'Coming soon'}
            </span>
            <span className="tp-open">{buttonLabel}</span>
          </div>
        </Link>
      ))}
      <style>{topicCardStyles}</style>
    </div>
  )
}

// e.g. plural(2, 'Textbook') → "2 Textbooks"
export function plural(n, word) {
  return `${n} ${n === 1 ? word : `${word}s`}`
}

export const topicCardStyles = `
  .tp-grid { width:100%; max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:20px; }
  .tp-card {
    display:flex; flex-direction:column; background:#fff; border:1px solid #E5E7EB; border-radius:16px;
    padding:12px; text-decoration:none; transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  }
  .tp-card:hover { transform:translateY(-3px); border-color:#E8A838; box-shadow:0 10px 25px rgba(27,42,74,.1); }
  .tp-skeleton { height:240px; background:linear-gradient(90deg,#fff,#F3F1FA,#fff); background-size:200% 100%; animation:tpShimmer 1.2s infinite; }
  @keyframes tpShimmer { to { background-position:-200% 0 } }
  .tp-thumb { aspect-ratio:16/9; border-radius:12px; overflow:hidden; background:linear-gradient(135deg,#EDE9FE,#F7F5FF); display:flex; align-items:center; justify-content:center; }
  .tp-thumb img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .4s ease; }
  .tp-card:hover .tp-thumb img { transform:scale(1.04); }
  .tp-initial { font-size:48px; font-weight:900; color:#7C3AED; }
  .tp-body { padding:14px 6px 6px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:8px; flex:1; }
  .tp-body h3 { font-family:'Playfair Display', serif; color:#C8102E; font-size:19px; font-weight:800; margin:0; }
  .tp-count { font-size:13px; font-weight:700; color:#1238B4; }
  .tp-soon { color:#9CA3AF; }
  .tp-open { margin-top:auto; background:#E8A838; color:#1B2A4A; padding:9px 18px; border-radius:10px; font-size:13px; font-weight:800; transition:background .2s ease; }
  .tp-card:hover .tp-open { background:#D4922A; }

  @media (max-width: 600px) {
    .tp-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .tp-card { padding:8px; }
    .tp-body h3 { font-size:16px; }
    .tp-open { padding:8px 12px; font-size:12px; }
  }
`
