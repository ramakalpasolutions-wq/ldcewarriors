
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroCarousel from '@/components/home/HeroCarousel'
import ArticleCard from '@/components/home/ArticleCard'
import LiveScrollSidebar from '@/components/home/LiveScrollSidebar'
import HomeVideoSection from '@/components/home/HomeSections'
import LearningGateway from '@/components/home/LearningGateway'
import TopicCardGrid, { plural } from '@/components/topics/TopicCardGrid'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/db'

// Force Next.js to render per-request dynamically so updates reflect instantly
export const dynamic = 'force-dynamic'

/* ─────────────────────────────────────────
   DATA FETCHING
───────────────────────────────────────── */
async function getData() {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  try {
    const [heroRes, videosRes, articlesRes, liveRes, topicsRes] =
      await Promise.allSettled([
        fetch(`${base}/api/admin/hero`, {
          next: { revalidate: 60 },
        }),
        fetch(`${base}/api/videos?type=free&homepage=true&limit=10`, {
          next: { revalidate: 60 },
        }),
        fetch(`${base}/api/articles?homepage=true&limit=4`, {
          next: { revalidate: 60 },
        }),
        fetch(`${base}/api/articles?live=true&limit=20`, {
          next: { revalidate: 30 },
        }),
        fetch(`${base}/api/admin/topics`, {
          next: { revalidate: 120 },
        }),
      ])

    return {
      heroItems:
        heroRes.status === 'fulfilled' && heroRes.value.ok
          ? (await heroRes.value.json()).items || []
          : [],

      freeVideos:
        videosRes.status === 'fulfilled' && videosRes.value.ok
          ? (await videosRes.value.json()).videos || []
          : [],

      articles:
        articlesRes.status === 'fulfilled' && articlesRes.value.ok
          ? (await articlesRes.value.json()).articles || []
          : [],

      liveArticles:
        liveRes.status === 'fulfilled' && liveRes.value.ok
          ? (await liveRes.value.json()).articles || []
          : [],

      topics:
        topicsRes.status === 'fulfilled' && topicsRes.value.ok
          ? (await topicsRes.value.json()).topics || []
          : [],
    }
  } catch {
    return {
      heroItems: [],
      freeVideos: [],
      articles: [],
      liveArticles: [],
      topics: [],
    }
  }
}

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */

const t = {
  navy: '#1B2A4A',
  navyLight: '#243656',
  navyDark: '#12203A',
  gold: '#E8A838',
  goldDark: '#D4922A',
  goldLight: '#F0C060',
  teal: '#2A9D8F',
  bg: '#F5F3EF',
  card: '#FFFFFF',
  text: '#1A1D23',
  muted: '#6B7280',
  faint: '#9CA3AF',
  border: '#E5E7EB',
}

/* ─────────────────────────────────────────
   SHARED UI ATOMS
───────────────────────────────────────── */
function SectionBadge({ children }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 700,
        color: t.navy,
        background: 'rgba(27,42,74,.06)',
        border: '1px solid rgba(27,42,74,.12)',
        padding: '5px 14px',
        borderRadius: '999px',
        textTransform: 'uppercase',
        letterSpacing: '1.2px',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: t.gold,
        }}
      />
      {children}
    </span>
  )
}

function SectionHeader({
  badge,
  title,
  subtitle,
  center = false,
}) {
  return (
    <div
      style={{
        textAlign: center ? 'center' : 'left',
        marginBottom: center ? '36px' : 0,
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <SectionBadge>{badge}</SectionBadge>
      </div>

      <h2
        style={{
          fontFamily: 'Playfair Display,serif',
          fontWeight: 800,
          fontSize: 'clamp(22px,3.5vw,34px)',
          color: t.text,
          lineHeight: 1.2,
          marginBottom: subtitle ? '8px' : 0,
          letterSpacing: '-.5px',
        }}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          style={{
            color: t.muted,
            fontSize: '14px',
            lineHeight: 1.65,
            maxWidth: '500px',
            margin: center ? '0 auto' : 0,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}

function ViewAllBtn({
  href,
  label,
  fullWidth = false,
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '8px 18px',
        borderRadius: '10px',
        background: 'rgba(27,42,74,.06)',
        border: '1px solid rgba(27,42,74,.12)',
        color: t.navy,
        fontSize: '12px',
        fontWeight: 600,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : 'auto',
        transition: 'all .2s ease',
      }}
    >
      {label}
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
    <div
      style={{
        background:
          `linear-gradient(135deg,${t.navy},${t.navyLight})`,
        padding: '11px 0',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div className="marquee-track">
        {doubled.map((a, i) => (
          <Link
            key={`${a._id}-${i}`}
            href={`/articles/${a._id || a.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 28px',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              color: 'rgba(255,255,255,.65)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: t.gold,
                flexShrink: 0,
              }}
            />
            {a.title}
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   CTA SECTION
   Removed dynamically if subscribed
───────────────────────────────────────── */
function CTASection() {
  return (
    <section
      style={{
        position: 'relative',
        padding: 'clamp(56px,8vw,96px) 0',
        overflow: 'hidden',
        background:
          `linear-gradient(135deg,${t.navy} 0%,${t.navyLight} 50%,${t.navyDark} 100%)`,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(232,168,56,.05) 1px,transparent 1px),
            linear-gradient(90deg,rgba(232,168,56,.05) 1px,transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: '720px',
          margin: '0 auto',
          padding: '0 clamp(16px,4vw,32px)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: t.gold,
            background: 'rgba(232,168,56,.1)',
            border: '1px solid rgba(232,168,56,.2)',
            padding: '5px 14px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '18px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: t.gold,
            }}
          />
          Join Thousands of Successful Candidates
        </div>

        <h2
          style={{
            fontFamily: 'Playfair Display,serif',
            fontWeight: 800,
            fontSize: 'clamp(26px,5vw,50px)',
            color: '#FFFFFF',
            lineHeight: 1.12,
            marginBottom: '14px',
            letterSpacing: '-1px',
          }}
        >
          Ready to{' '}
          <span
            style={{
              background:
                `linear-gradient(135deg,${t.gold},${t.goldLight})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Crack Your LDCE?
          </span>
        </h2>

        <p
          style={{
            color: 'rgba(255,255,255,.5)',
            fontSize: 'clamp(14px,1.8vw,16px)',
            lineHeight: 1.75,
            maxWidth: '460px',
            margin: '0 auto 32px',
          }}
        >
          Expert content, structured learning, and guaranteed results —
          everything you need in one platform.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <Link
            href="/auth/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '13px 28px',
              borderRadius: '12px',
              background: t.teal,
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(42,157,143,.3)',
            }}
          >
            Register Free →
          </Link>

          <Link
            href="/join-family"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '13px 28px',
              borderRadius: '12px',
              background:
                `linear-gradient(135deg,${t.gold},${t.goldDark})`,
              color: t.navy,
              fontSize: '15px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(232,168,56,.3)',
            }}
          >
            ⭐ Join Family
          </Link>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 'clamp(20px,4vw,40px)',
            marginTop: '40px',
          }}
        >
          {[
            {
              val: 'Join Family',
              lbl: 'Video Lectures',
            },
            {
              val: '8+',
              lbl: 'Topics Covered',
            },
            {
              val: '4 months',
              lbl: 'Full Access',
            },
          ].map(s => (
            <div
              key={s.lbl}
              style={{ textAlign: 'center' }}
            >
              <div
                style={{
                  fontFamily: 'Playfair Display,serif',
                  fontSize: 'clamp(20px,3vw,26px)',
                  fontWeight: 800,
                  color: t.gold,
                  lineHeight: 1,
                }}
              >
                {s.val}
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,.38)',
                  marginTop: '4px',
                }}
              >
                {s.lbl}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────
   PAGE RENDERING
───────────────────────────────────────── */
export default async function HomePage() {
  const {
    heroItems,
    freeVideos,
    articles,
    liveArticles,
    topics,
  } = await getData()

  // Check live cookie auth on server side
  // to hide Join Family promotional elements.
  let isPremiumUser = false

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (token) {
      const decoded = verifyToken(token)

      if (decoded?.userId) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            isPremium: true,
            premiumExpiresAt: true,
          },
        })

        isPremiumUser = Boolean(
          user?.isPremium &&
          (
            !user?.premiumExpiresAt ||
            new Date(user.premiumExpiresAt) > new Date()
          )
        )
      }
    }
  } catch (err) {
    console.error('Server-side auth check failed:', err)
  }

  return (
    <>
      <style>{`
        *, *::before, *::after {
          box-sizing: border-box;
        }

        .home-root {
          min-height: 100vh;
          background: ${t.bg};
        }

        .home-wrap {
          max-width: 1380px;
          margin: 0 auto;
          padding: 0 clamp(16px,3vw,32px);
        }

        .section {
          padding: clamp(44px,6vw,72px) 0;
        }

        .divider {
          height: 1px;
          background:
            linear-gradient(90deg,transparent,${t.border},transparent);
        }

        .marquee-track {
          display: flex;
          animation: marquee 32s linear infinite;
          width: max-content;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }

        /* Article grid */

        .article-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 18px;
        }

        @media (max-width:639px) {
          .article-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }

        /* Articles + sidebar */

        .articles-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 28px;
          align-items: start;
        }

        .sidebar-sticky {
          position: sticky;
          top: 80px;
          height: calc(100vh - 100px);
          min-height: 400px;
        }

        @media (max-width:1023px) {
          .articles-layout {
            grid-template-columns: 1fr;
          }

          .sidebar-sticky {
            position: relative;
            top: auto;
            height: 420px;
            min-height: 0;
          }
        }

        .section-hrow {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 26px;
          flex-wrap: wrap;
        }

        .hide-mobile {
          display: block;
        }

        .show-mobile {
          display: none;
        }

        @media (max-width:639px) {
          .hide-mobile {
            display: none !important;
          }

          .show-mobile {
            display: flex !important;
          }
        }

        .empty-state {
          text-align: center;
          padding: clamp(32px,5vw,48px) 20px;
          border-radius: 16px;
          background: ${t.card};
          border: 1px solid ${t.border};
        }
      `}</style>

      <div className="home-root">
        <Navbar />

        {/* ═══════════════════════════════════
            EXISTING HERO
        ═══════════════════════════════════ */}
        <HeroCarousel
          slides={heroItems}
          topics={topics}
        />

        {/* EXISTING MARQUEE */}
        {liveArticles.length > 0 && (
          <MarqueeBanner articles={liveArticles} />
        )}

        {/* ═══════════════════════════════════
            NEW LEARNING & QUIZ SECTION
            Directly below Hero / Marquee
        ═══════════════════════════════════ */}
        <LearningGateway />

        <div className="home-wrap">

          {/* ═══════════════════════════════════
              FREE VIDEOS
          ═══════════════════════════════════ */}
          <section className="section">
            <div
              className="section-hrow"
              style={{
                alignItems: 'center',
                marginBottom: '22px',
              }}
            >
              <div
                style={{
                  maxWidth: '200px',
                  width: '100%',
                }}
              >
                <img
                  src="/free-videos-banner.png"
                  alt="Free videos - Watch demo classes"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                    mixBlendMode: 'multiply',
                  }}
                />
              </div>

              <div className="hide-mobile">
                <ViewAllBtn
                  href="/classes"
                  label="View All Classes →"
                />
              </div>
            </div>

            {freeVideos.length > 0 ? (
              <HomeVideoSection
                freeVideos={freeVideos}
              />
            ) : (
              <div className="empty-state">
                <div
                  style={{
                    fontSize: '36px',
                    marginBottom: '10px',
                  }}
                >
                  🎬
                </div>

                <p
                  style={{
                    color: t.muted,
                    fontSize: '14px',
                  }}
                >
                  Free videos coming soon!
                </p>
              </div>
            )}

            <div
              className="show-mobile"
              style={{
                marginTop: '20px',
                justifyContent: 'center',
              }}
            >
              <ViewAllBtn
                href="/classes"
                label="View All Classes →"
                fullWidth
              />
            </div>
          </section>

          <div className="divider" />

          {/* ═══════════════════════════════════
              TOPIC-WISE COURSES
          ═══════════════════════════════════ */}
          <section className="section">
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  maxWidth: '350px',
                  width: '150%',
                }}
              >
                <img
                  src="/complete-lectures-banner.png"
                  alt="Complete Lectures Banner"
                  style={{
                    width: '400%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                    mixBlendMode: 'multiply',
                  }}
                />
              </div>
            </div>

            {topics.length > 0 ? (
              <TopicCardGrid
                buttonLabel="Watch Classes →"
                items={topics.map(topic => {
                  const total = topic.videoCount || 0
                  const free = topic.freeVideoCount || 0
                  return {
                    id: topic._id,
                    name: topic.name,
                    thumbnail: topic.thumbnail,
                    href: `/classes?topic=${topic._id}`,
                    countLabel: total
                      ? `🎬 ${plural(total, 'Video')}${free ? ` · ${free} free` : ''}`
                      : '',
                  }
                })}
              />
            ) : (
              <div className="empty-state">
                <div
                  style={{
                    fontSize: '36px',
                    marginBottom: '10px',
                  }}
                >
                  📚
                </div>

                <p
                  style={{
                    color: t.muted,
                    fontSize: '14px',
                  }}
                >
                  Join Family topics are being prepared.
                  Stay tuned!
                </p>
              </div>
            )}

            {!isPremiumUser && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '40px',
                }}
              >
                <Link
                  href="/join-family"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding:
                      'clamp(12px,2vw,15px) clamp(24px,3vw,36px)',
                    borderRadius: '12px',
                    background:
                      `linear-gradient(135deg,${t.gold},${t.goldDark})`,
                    color: t.navy,
                    fontSize: 'clamp(13px,1.5vw,15px)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow:
                      '0 8px 24px rgba(232,168,56,.3)',
                  }}
                >
                  ⭐ Get Join Family Access
                </Link>
              </div>
            )}
          </section>

          <div className="divider" />

          {/* ═══════════════════════════════════
              ARTICLES + LIVE SIDEBAR
          ═══════════════════════════════════ */}
          <section className="section">
            <div className="articles-layout">
              <div>
                <div className="section-hrow">
                  <SectionHeader
                    badge="Articles"
                    title="Latest Insights"
                    subtitle="Expert articles on strategies, notifications, and updates."
                  />

                  <div className="hide-mobile">
                    <ViewAllBtn
                      href="/articles"
                      label="View More →"
                    />
                  </div>
                </div>

                {articles.length > 0 ? (
                  <div className="article-grid">
                    {articles.slice(0, 4).map(article => (
                      <ArticleCard
                        key={article._id}
                        article={article}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div
                      style={{
                        fontSize: '36px',
                        marginBottom: '10px',
                      }}
                    >
                      📰
                    </div>

                    <p style={{ color: t.muted }}>
                      Articles coming soon!
                    </p>
                  </div>
                )}

                <div
                  className="show-mobile"
                  style={{
                    marginTop: '20px',
                    justifyContent: 'center',
                  }}
                >
                  <ViewAllBtn
                    href="/articles"
                    label="View More Articles →"
                    fullWidth
                  />
                </div>
              </div>

              <div className="sidebar-sticky">
                <LiveScrollSidebar
                  articles={liveArticles}
                  fullHeight
                />
              </div>
            </div>
          </section>
        </div>

        {/* Hide CTA for existing premium members */}
        {!isPremiumUser && <CTASection />}

        <Footer />
      </div>
    </>
  )
}
