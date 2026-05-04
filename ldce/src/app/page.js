// src/app/page.js
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroCarousel from '@/components/home/HeroCarousel'
import ArticleCard from '@/components/home/ArticleCard'
import LiveScrollSidebar from '@/components/home/LiveScrollSidebar'
import HomeVideoSection from '@/components/home/HomeSections'

/* ─────────────────────────────────────────
   DATA FETCHING
───────────────────────────────────────── */
async function getData() {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  try {
    const [heroRes, videosRes, articlesRes, liveRes, topicsRes] = await Promise.allSettled([
      fetch(`${base}/api/admin/hero`,                              { next: { revalidate: 60  } }),
      fetch(`${base}/api/videos?type=free&homepage=true&limit=10`, { next: { revalidate: 60  } }),
      fetch(`${base}/api/articles?homepage=true&limit=4`,          { next: { revalidate: 60  } }),
      fetch(`${base}/api/articles?live=true&limit=20`,             { next: { revalidate: 30  } }),
      fetch(`${base}/api/admin/topics`,                            { next: { revalidate: 120 } }),
    ])
    return {
      heroItems:    heroRes.status    === 'fulfilled' && heroRes.value.ok    ? (await heroRes.value.json()).items    || [] : [],
      freeVideos:   videosRes.status  === 'fulfilled' && videosRes.value.ok  ? (await videosRes.value.json()).videos || [] : [],
      articles:     articlesRes.status === 'fulfilled' && articlesRes.value.ok ? (await articlesRes.value.json()).articles || [] : [],
      liveArticles: liveRes.status    === 'fulfilled' && liveRes.value.ok    ? (await liveRes.value.json()).articles || [] : [],
      topics:       topicsRes.status  === 'fulfilled' && topicsRes.value.ok  ? (await topicsRes.value.json()).topics || [] : [],
    }
  } catch {
    return { heroItems: [], freeVideos: [], articles: [], liveArticles: [], topics: [] }
  }
}

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const TOPIC_ICONS = {
  'office procedure': '📋', 'service rules': '⚖️', 'financial rules': '💰',
  'acts & statutes': '📜', 'general knowledge': '🌐', 'english grammar': '✍️',
  'current affairs': '📰', 'model q&a': '❓',
}
function getTopicIcon(name) { return TOPIC_ICONS[name?.toLowerCase()] || '📚' }

const t = {
  navy: '#1B2A4A', navyLight: '#243656', navyDark: '#12203A',
  gold: '#E8A838', goldDark: '#D4922A', goldLight: '#F0C060',
  teal: '#2A9D8F',
  bg: '#F5F3EF', card: '#FFFFFF', text: '#1A1D23',
  muted: '#6B7280', faint: '#9CA3AF', border: '#E5E7EB',
}

/* ─────────────────────────────────────────
   SHARED UI ATOMS
───────────────────────────────────────── */
function SectionBadge({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontSize: '11px', fontWeight: 700, color: t.navy,
      background: 'rgba(27,42,74,.06)', border: '1px solid rgba(27,42,74,.12)',
      padding: '5px 14px', borderRadius: '999px',
      textTransform: 'uppercase', letterSpacing: '1.2px',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.gold }} />
      {children}
    </span>
  )
}

function SectionHeader({ badge, title, subtitle, center = false }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', marginBottom: center ? '36px' : 0 }}>
      <div style={{ marginBottom: '10px' }}><SectionBadge>{badge}</SectionBadge></div>
      <h2 style={{
        fontFamily: 'Playfair Display,serif', fontWeight: 800,
        fontSize: 'clamp(22px,3.5vw,34px)', color: t.text,
        lineHeight: 1.2, marginBottom: subtitle ? '8px' : 0, letterSpacing: '-.5px',
      }}>{title}</h2>
      {subtitle && (
        <p style={{
          color: t.muted, fontSize: '14px', lineHeight: 1.65,
          maxWidth: '500px', margin: center ? '0 auto' : 0,
        }}>{subtitle}</p>
      )}
    </div>
  )
}

function ViewAllBtn({ href, label, fullWidth = false }) {
  return (
    <Link href={href} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      padding: '8px 18px', borderRadius: '10px',
      background: 'rgba(27,42,74,.06)', border: '1px solid rgba(27,42,74,.12)',
      color: t.navy, fontSize: '12px', fontWeight: 600,
      textDecoration: 'none', whiteSpace: 'nowrap',
      width: fullWidth ? '100%' : 'auto', transition: 'all .2s ease',
    }}>{label}</Link>
  )
}

/* ─────────────────────────────────────────
   TOPIC CARD  ← fixed image fitting
───────────────────────────────────────── */
function TopicCard({ topic }) {
  const hasThumbnail = !!topic.thumbnail
  const icon = getTopicIcon(topic.name)

  return (
    <Link
      href={`/classes?topic=${topic._id}`}
      className="topic-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {/* ── Thumbnail wrapper ──
          paddingTop 56.25% = 16/9 ratio trick.
          position:relative + overflow:hidden keeps the image
          perfectly cropped regardless of natural image size.        */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%',   /* 9/16 = 56.25% — true 16:9 */
        overflow: 'hidden',
        background: '#F0EDE8',
        flexShrink: 0,           /* stop flex from squishing it */
      }}>
        {hasThumbnail ? (
          <>
            <img
              src={topic.thumbnail}
              alt={topic.name}
              className="topic-card-img"
              style={{
                position: 'absolute',
                inset: 0,               /* top/right/bottom/left: 0 */
                width: '90%',
                height: '90%',
                objectFit: 'fill',     /* fill & crop — never squish */
                objectPosition: 'center',
                display: 'block',
              }}
            />
            {/* bottom gradient overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
              background: 'linear-gradient(to top,rgba(0,0,0,0.38),transparent)',
              pointerEvents: 'none',
            }} />
          </>
        ) : (
          /* No thumbnail — centered emoji placeholder */
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '44px',
            background: 'linear-gradient(135deg,#F5F3EF,#EDE8E0)',
          }}>{icon}</div>
        )}

        {/* Video count badge — top right */}
        {/* <div style={{
          position: 'absolute', top: '8px', right: '8px',
          fontSize: '10px', fontWeight: 700,
          color: hasThumbnail ? '#FFFFFF' : t.muted,
          background: hasThumbnail ? 'rgba(0,0,0,0.52)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(4px)',
          padding: '4px 10px', borderRadius: '999px',
          border: hasThumbnail ? 'none' : `1px solid ${t.border}`,
        }}>{topic.videoCount || 0} Videos</div> */}

        {/* Icon badge — bottom left (only when thumbnail present) */}
        {hasThumbnail && (
          <div style={{
            position: 'absolute', bottom: '8px', left: '10px',
            fontSize: '20px',
            filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.55))',
          }}>{icon}</div>
        )}
      </div>

      {/* ── Card body ── */}
      <div style={{
        padding: '14px 16px 16px',
        display: 'flex', flexDirection: 'column', gap: '6px',
        flex: 1,                /* take remaining height evenly across row */
      }}>
        <h3 style={{
          fontFamily: 'Playfair Display,serif',
          fontWeight: 700, fontSize: '25px', color: '#b91515',
          lineHeight: 1.35, textAlign: 'center',
          margin: 0,
        }}>{topic.name}</h3>

        {topic.description && (
          <p style={{
            color: t.muted, fontSize: '12px', lineHeight: 1.55,
            textAlign: 'center', margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{topic.description}</p>
        )}

        {/* Footer link */}
        <div style={{
          marginTop: 'auto', paddingTop: '10px',
          borderTop: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '6px',
        }}>
          <span style={{
            fontSize: '11px', fontWeight: 600, color: t.gold,
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>View Videos →</span>
        </div>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────
   MARQUEE BANNER
───────────────────────────────────────── */
function MarqueeBanner({ articles }) {
  if (!articles.length) return null
  const doubled = [...articles, ...articles]
  return (
    <div style={{
      background: `linear-gradient(135deg,${t.navy},${t.navyLight})`,
      padding: '11px 0', overflow: 'hidden', position: 'relative',
    }}>
      <div className="marquee-track">
        {doubled.map((a, i) => (
          <Link key={`${a._id}-${i}`} href={`/articles/${a._id || a.id}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '0 28px', whiteSpace: 'nowrap',
            textDecoration: 'none', color: 'rgba(255,255,255,.65)',
            fontSize: '13px', fontWeight: 500,
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.gold, flexShrink: 0 }} />
            {a.title}
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   CTA SECTION
───────────────────────────────────────── */
function CTASection() {
  return (
    <section style={{
      position: 'relative', padding: 'clamp(56px,8vw,96px) 0',
      overflow: 'hidden',
      background: `linear-gradient(135deg,${t.navy} 0%,${t.navyLight} 50%,${t.navyDark} 100%)`,
    }}>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(232,168,56,.05) 1px,transparent 1px),
          linear-gradient(90deg,rgba(232,168,56,.05) 1px,transparent 1px)
        `, backgroundSize: '60px 60px',
      }} />
      <div style={{
        position: 'relative', maxWidth: '720px',
        margin: '0 auto', padding: '0 clamp(16px,4vw,32px)', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '11px', fontWeight: 700, color: t.gold,
          background: 'rgba(232,168,56,.1)', border: '1px solid rgba(232,168,56,.2)',
          padding: '5px 14px', borderRadius: '999px',
          textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '18px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.gold }} />
          Join Thousands of Successful Candidates
        </div>

        <h2 style={{
          fontFamily: 'Playfair Display,serif', fontWeight: 800,
          fontSize: 'clamp(26px,5vw,50px)', color: '#FFFFFF',
          lineHeight: 1.12, marginBottom: '14px', letterSpacing: '-1px',
        }}>
          Ready to{' '}
          <span style={{
            background: `linear-gradient(135deg,${t.gold},${t.goldLight})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Crack Your LDCE?</span>
        </h2>

        <p style={{
          color: 'rgba(255,255,255,.5)', fontSize: 'clamp(14px,1.8vw,16px)',
          lineHeight: 1.75, maxWidth: '460px', margin: '0 auto 32px',
        }}>
          Expert content, structured learning, and guaranteed results —
          everything you need in one platform.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
          <Link href="/auth/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '13px 28px', borderRadius: '12px',
            background: t.teal, color: '#fff',
            fontSize: '15px', fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(42,157,143,.3)',
          }}>Register Free →</Link>
          <Link href="/premium" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '13px 28px', borderRadius: '12px',
            background: `linear-gradient(135deg,${t.gold},${t.goldDark})`,
            color: t.navy, fontSize: '15px', fontWeight: 700,
            textDecoration: 'none', boxShadow: '0 8px 24px rgba(232,168,56,.3)',
          }}>⭐ Get Premium</Link>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
          gap: 'clamp(20px,4vw,40px)', marginTop: '40px',
        }}>
          {[
            { val: 'Premium', lbl: 'Video Lectures' },
            { val: '8+',      lbl: 'Topics Covered' },
            { val: '4 months',lbl: 'Full Access' },
          ].map(s => (
            <div key={s.lbl} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'Playfair Display,serif',
                fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: t.gold, lineHeight: 1,
              }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.38)', marginTop: '4px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═════════════════════════════════════════
   PAGE
═════════════════════════════════════════ */
export default async function HomePage() {
  const { heroItems, freeVideos, articles, liveArticles, topics } = await getData()

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .home-root { min-height: 100vh; background: ${t.bg}; }
        .home-wrap {
          max-width: 1380px; margin: 0 auto;
          padding: 0 clamp(16px,3vw,32px);
        }
        .section { padding: clamp(44px,6vw,72px) 0; }
        .divider {
          height: 1px;
          background: linear-gradient(90deg,transparent,${t.border},transparent);
        }

        .marquee-track {
          display: flex;
          animation: marquee 32s linear infinite;
          width: max-content;
        }
        .marquee-track:hover { animation-play-state: paused; }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

        /* ── Topic grid ──
           align-items:stretch so every card in a row is the same height */
        .topics-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 20px;
          align-items: stretch;
        }
        @media (max-width:1023px) { .topics-grid { grid-template-columns:repeat(2,1fr); gap:16px; } }
        @media (max-width:639px)  { .topics-grid { grid-template-columns:1fr; gap:14px; } }

        /* ── Topic card ── */
        .topic-card {
          border-radius: 14px;
          overflow: hidden;
          background: ${t.card};
          border: 1px solid ${t.border};
          display: flex;
          flex-direction: column;   /* body grows below fixed-ratio image */
          transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .topic-card:hover {
          border-color: ${t.gold};
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.09);
        }
        /* Scale only the img, not the whole wrapper */
        .topic-card-img {
    
          transition: transform .4s ease;
          display: block;
        }
        .topic-card:hover .topic-card-img {
          transform: scale(1.06);
        }

        /* Article grid */
        .article-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 18px;
        }
        @media (max-width:639px) { .article-grid { grid-template-columns:1fr; gap:14px; } }

        /* Articles + sidebar layout */
        .articles-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 28px; align-items: start;
        }
        .sidebar-sticky {
          position: sticky; top: 80px;
          height: calc(100vh - 100px); min-height: 400px;
        }
        @media (max-width:1023px) {
          .articles-layout { grid-template-columns: 1fr; }
          .sidebar-sticky { position: relative; top: auto; height: 420px; min-height: 0; }
        }

        .section-hrow {
          display: flex; align-items: flex-end;
          justify-content: space-between; gap: 16px;
          margin-bottom: 26px; flex-wrap: wrap;
        }

        .hide-mobile { display: block; }
        .show-mobile { display: none; }
        @media (max-width:639px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }

        .empty-state {
          text-align: center; padding: clamp(32px,5vw,48px) 20px;
          border-radius: 16px; background: ${t.card};
          border: 1px solid ${t.border};
        }
      `}</style>

      <div className="home-root">
        <Navbar />

        {/* Hero */}
        <HeroCarousel slides={heroItems} topics={topics} />

        {/* Marquee */}
        {liveArticles.length > 0 && <MarqueeBanner articles={liveArticles} />}

        <div className="home-wrap">

          {/* FREE VIDEOS */}
          <section className="section">
            <div className="section-hrow">
              <SectionHeader
                badge="Free Videos"
                title="Start Learning Today"
                subtitle="Watch our free sample videos and get a taste of expert-led content."
              />
              <div className="hide-mobile">
                <ViewAllBtn href="/classes" label="View All Classes →" />
              </div>
            </div>

            {freeVideos.length > 0
              ? <HomeVideoSection freeVideos={freeVideos} />
              : (
                <div className="empty-state">
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎬</div>
                  <p style={{ color: t.muted, fontSize: '14px' }}>Free videos coming soon!</p>
                </div>
              )
            }

            <div className="show-mobile" style={{ marginTop: '20px', justifyContent: 'center' }}>
              <ViewAllBtn href="/classes" label="View All Classes →" fullWidth />
            </div>
          </section>

          <div className="divider" />

          {/* TOPIC-WISE COURSES */}
          <section className="section">
            <SectionHeader
              badge="Premium Content"
              title="Topic-Wise Courses"
              subtitle="Comprehensive premium courses. Click to view videos."
              center
            />

            {topics.length > 0 ? (
              <div className="topics-grid">
                {topics.map(topic => (
                  <TopicCard key={topic._id} topic={topic} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📚</div>
                <p style={{ color: t.muted, fontSize: '14px' }}>
                  Premium topics are being prepared. Stay tuned!
                </p>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Link href="/premium" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: 'clamp(12px,2vw,15px) clamp(24px,3vw,36px)', borderRadius: '12px',
                background: `linear-gradient(135deg,${t.gold},${t.goldDark})`,
                color: t.navy, fontSize: 'clamp(13px,1.5vw,15px)', fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 8px 24px rgba(232,168,56,.3)',
              }}>⭐ Get Premium Access</Link>
              <p style={{ color: t.faint, fontSize: '12px', marginTop: '10px' }}>
                Secure payment via Razorpay
              </p>
            </div>
          </section>

          <div className="divider" />

          {/* ARTICLES + LIVE SIDEBAR */}
          <section className="section">
            <div className="articles-layout">
              <div>
                <div className="section-hrow" >
                  <SectionHeader
                    badge="Articles"
                    title="Latest Insights"
                    subtitle="Expert articles on strategies, notifications, and updates."
                  />
                  <div className="hide-mobile" >
                    <ViewAllBtn href="/articles" label="View More →" />
                  </div>
                </div>

                {articles.length > 0 ? (
                  <div className="article-grid">
                    {articles.slice(0, 4).map(article => (
                      <ArticleCard key={article._id} article={article} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>📰</div>
                    <p style={{ color: t.muted }}>Articles coming soon!</p>
                  </div>
                )}

                <div className="show-mobile" style={{ marginTop: '20px', justifyContent: 'center' }}>
                  <ViewAllBtn href="/articles" label="View More Articles →" fullWidth />
                </div>
              </div>

              <div className="sidebar-sticky">
                <LiveScrollSidebar articles={liveArticles} fullHeight />
              </div>
            </div>
          </section>

        </div>

        <CTASection />
        <Footer />
      </div>
    </>
  )
}