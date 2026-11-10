import Link from 'next/link'

// Renders the About Us content. No hooks, so it works on the public
// page (server) and as the live preview in Admin → About Us.

function Paragraphs({ text, className }) {
  return String(text || '')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map((p, i) => <p key={i} className={className}>{p}</p>)
}

function Hero({ s }) {
  return (
    <section className={`ab-hero ${s.image ? 'ab-hero-img' : ''}`}>
      {s.image && <img src={s.image} alt="" className="ab-hero-bg" />}
      <div className="ab-hero-inner">
        {s.eyebrow && <span className="ab-eyebrow">{s.eyebrow}</span>}
        <h1>{s.title}</h1>
        {s.subtitle && <p>{s.subtitle}</p>}
      </div>
    </section>
  )
}

function Story({ s }) {
  return (
    <section className="ab-section">
      <div className={`ab-story ${s.image ? 'ab-story-2col' : ''}`}>
        <div>
          <h2 className="ab-h2">{s.heading}</h2>
          <span className="ab-line" />
          <Paragraphs text={s.text} className="ab-p" />
        </div>
        {s.image && <img src={s.image} alt="" className="ab-story-img" />}
      </div>
    </section>
  )
}

function MissionVision({ s }) {
  return (
    <section className="ab-section">
      <div className="ab-mv">
        <div className="ab-mv-card">
          <span className="ab-mv-icon">🎯</span>
          <h3>{s.missionTitle}</h3>
          <Paragraphs text={s.mission} className="ab-p" />
        </div>
        <div className="ab-mv-card ab-mv-dark">
          <span className="ab-mv-icon">🔭</span>
          <h3>{s.visionTitle}</h3>
          <Paragraphs text={s.vision} className="ab-p" />
        </div>
      </div>
    </section>
  )
}

function Stats({ s, counts }) {
  const items = s.items
    .map(it => ({ ...it, shown: it.auto ? Number(counts?.[it.auto] ?? 0).toLocaleString('en-IN') : it.value }))
    .filter(it => it.label && it.shown !== '')
  if (!items.length) return null
  return (
    <section className="ab-section">
      {s.heading && <h2 className="ab-h2 ab-center">{s.heading}</h2>}
      <div className="ab-stats">
        {items.map((it, i) => (
          <div key={i} className="ab-stat">
            <strong>{it.shown}{it.auto ? '+' : ''}</strong>
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Features({ s }) {
  const items = s.items.filter(it => it.title || it.text)
  if (!items.length) return null
  return (
    <section className="ab-section">
      {s.heading && <h2 className="ab-h2 ab-center">{s.heading}</h2>}
      <div className="ab-features">
        {items.map((it, i) => (
          <div key={i} className="ab-feature">
            {it.icon && <span className="ab-feature-icon">{it.icon}</span>}
            <h3>{it.title}</h3>
            {it.text && <p>{it.text}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

function Team({ s }) {
  const members = s.members.filter(m => m.name)
  if (!members.length) return null
  return (
    <section className="ab-section">
      {s.heading && <h2 className="ab-h2 ab-center">{s.heading}</h2>}
      {s.subtitle && <p className="ab-sub ab-center">{s.subtitle}</p>}
      <div className="ab-team">
        {members.map((m, i) => (
          <div key={i} className="ab-member">
            {m.photo ? (
              <img src={m.photo} alt={m.name} className="ab-member-photo" />
            ) : (
              <span className="ab-member-photo ab-member-initial">{m.name.charAt(0)}</span>
            )}
            <h3>{m.name}</h3>
            {m.role && <span className="ab-member-role">{m.role}</span>}
            {m.bio && <p>{m.bio}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

function Cta({ s }) {
  return (
    <section className="ab-section">
      <div className="ab-cta">
        <h2>{s.title}</h2>
        {s.text && <p>{s.text}</p>}
        {s.buttonLabel && (
          s.buttonLink.startsWith('/')
            ? <Link href={s.buttonLink} className="ab-cta-btn">{s.buttonLabel} →</Link>
            : <a href={s.buttonLink} className="ab-cta-btn" target="_blank" rel="noopener noreferrer">{s.buttonLabel} →</a>
        )}
      </div>
    </section>
  )
}

const RENDER = {
  hero: (s) => <Hero s={s} />,
  story: (s) => <Story s={s} />,
  missionVision: (s) => <MissionVision s={s} />,
  stats: (s, counts) => <Stats s={s} counts={counts} />,
  features: (s) => <Features s={s} />,
  team: (s) => <Team s={s} />,
  cta: (s) => <Cta s={s} />,
}

export default function AboutView({ about, counts }) {
  const visible = about.order.filter(key => about[key]?.show)
  // Leave room for the fixed navbar when the page doesn't start with the banner
  const startsWithHero = visible[0] === 'hero'
  return (
    <div className={`ab-page ${startsWithHero ? '' : 'ab-page-nohero'}`}>
      {visible.map(key => <div key={key}>{RENDER[key](about[key], counts)}</div>)}
      <style>{aboutStyles}</style>
    </div>
  )
}

export const aboutStyles = `
  .ab-page { background:#F5F3EF; color:#1A1D23; padding-bottom:50px; min-height:60vh; }
  .ab-page-nohero { padding-top:90px; }
  .ab-section { max-width:1100px; margin:0 auto; padding:44px 16px 0; }
  .ab-h2 { font-family:'Playfair Display', serif; color:#1B2A4A; font-size:clamp(24px,3.6vw,34px); font-weight:800; margin:0 0 6px; }
  .ab-center { text-align:center; }
  .ab-line { display:block; width:70px; height:4px; border-radius:4px; background:#E8A838; margin:6px 0 18px; }
  .ab-p { color:#4B5563; font-size:16px; line-height:1.8; margin:0 0 14px; white-space:pre-line; }
  .ab-sub { color:#6B7280; margin:0 0 24px; }

  .ab-hero { position:relative; overflow:hidden; padding:150px 16px 80px; text-align:center; background:linear-gradient(135deg,#1B2A4A,#243656); color:#fff; }
  .ab-hero-bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.28; }
  .ab-hero-inner { position:relative; max-width:820px; margin:0 auto; }
  .ab-eyebrow { display:inline-block; padding:6px 14px; border-radius:999px; background:rgba(232,168,56,.15); color:#E8A838; font-weight:800; font-size:12px; letter-spacing:1px; text-transform:uppercase; margin-bottom:16px; }
  .ab-hero h1 { font-family:'Playfair Display', serif; font-size:clamp(30px,5.4vw,52px); font-weight:800; line-height:1.15; margin:0 0 16px; }
  .ab-hero p { color:rgba(255,255,255,.75); font-size:clamp(15px,1.8vw,18px); line-height:1.7; margin:0; }

  .ab-story { display:grid; gap:32px; align-items:center; }
  .ab-story-2col { grid-template-columns:1.1fr .9fr; }
  .ab-story-img { width:100%; border-radius:20px; object-fit:cover; aspect-ratio:4/3; box-shadow:0 14px 34px rgba(27,42,74,.14); }

  .ab-mv { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .ab-mv-card { background:#fff; border:1px solid #E5E7EB; border-radius:20px; padding:28px; }
  .ab-mv-card h3 { font-family:'Playfair Display', serif; color:#C8102E; font-size:22px; margin:10px 0 10px; }
  .ab-mv-dark { background:linear-gradient(135deg,#1B2A4A,#243656); border:0; }
  .ab-mv-dark h3 { color:#E8A838; }
  .ab-mv-dark .ab-p { color:rgba(255,255,255,.8); }
  .ab-mv-icon { font-size:30px; }

  .ab-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:16px; margin-top:22px; }
  .ab-stat { background:#fff; border:1px solid #E5E7EB; border-radius:18px; padding:22px 12px; text-align:center; display:flex; flex-direction:column; gap:6px; }
  .ab-stat strong { font-family:'Playfair Display', serif; font-size:clamp(30px,4vw,40px); color:#C8102E; line-height:1; }
  .ab-stat span { color:#1B2A4A; font-weight:700; font-size:14px; }

  .ab-features { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:18px; margin-top:22px; }
  .ab-feature { background:#fff; border:1px solid #E5E7EB; border-radius:18px; padding:24px; transition:transform .25s ease, border-color .25s ease; }
  .ab-feature:hover { transform:translateY(-3px); border-color:#E8A838; }
  .ab-feature-icon { font-size:30px; }
  .ab-feature h3 { font-size:18px; font-weight:800; color:#1B2A4A; margin:10px 0 6px; }
  .ab-feature p { color:#6B7280; font-size:14px; line-height:1.7; margin:0; }

  .ab-team { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:18px; }
  .ab-member { background:#fff; border:1px solid #E5E7EB; border-radius:18px; padding:22px; text-align:center; }
  .ab-member-photo { width:110px; height:110px; border-radius:50%; object-fit:cover; margin:0 auto 12px; display:block; border:4px solid #F5F3EF; }
  .ab-member-initial { display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#1B2A4A,#243656); color:#E8A838; font-size:40px; font-weight:900; }
  .ab-member h3 { font-size:17px; font-weight:800; color:#1B2A4A; margin:0; }
  .ab-member-role { display:block; color:#D4922A; font-weight:700; font-size:13px; margin:4px 0 8px; }
  .ab-member p { color:#6B7280; font-size:13px; line-height:1.6; margin:0; }

  .ab-cta { background:linear-gradient(135deg,#1B2A4A,#243656); color:#fff; border-radius:24px; padding:40px 24px; text-align:center; }
  .ab-cta h2 { font-family:'Playfair Display', serif; font-size:clamp(24px,3.4vw,32px); margin:0 0 10px; }
  .ab-cta p { color:rgba(255,255,255,.75); margin:0 auto 22px; max-width:620px; line-height:1.7; }
  .ab-cta-btn { display:inline-block; background:#E8A838; color:#1B2A4A; padding:12px 26px; border-radius:12px; font-weight:800; text-decoration:none; }
  .ab-cta-btn:hover { background:#D4922A; }

  @media (max-width: 760px) {
    .ab-hero { padding:120px 16px 56px; }
    .ab-story-2col, .ab-mv { grid-template-columns:1fr; }
    .ab-section { padding-top:34px; }
  }
`
