// src/app/articles/[id]/page.js
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import ReadingProgress from '@/components/ui/ReadingProgress'

async function getArticle(id) {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${base}/api/articles/${id}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      return data.article || null
    }
  } catch (err) {
    console.error('Failed to fetch article:', err)
  }
  return null
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const article = await getArticle(id)
  return {
    title: article?.title || 'Article | LDCE Warriors',
    description: article?.excerpt || 'Read this article on LDCE Warriors',
    openGraph: {
      title: article?.title || 'Article | LDCE Warriors',
      description: article?.excerpt || '',
      images: article?.thumbnail ? [article.thumbnail] : [],
    },
  }
}

const tk = {
  navy: '#1B2A4A',
  navyLight: '#243656',
  gold: '#E8A838',
  goldDark: '#D4922A',
  teal: '#2A9D8F',
  bg: '#F5F3EF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#1A1D23',
  muted: '#6B7280',
  faint: '#9CA3AF',
}

export default async function ArticlePage({ params }) {
  const { id } = await params
  const article = await getArticle(id)

  /* ── Not Found ── */
  if (!article) {
    return (
      <div style={{ minHeight: '100vh', background: tk.bg }}>
        <Navbar />
        <div style={{
          minHeight: 'calc(100vh - 140px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div style={{
              width: '88px',
              height: '88px',
              borderRadius: '24px',
              background: 'rgba(27, 42, 74, 0.06)',
              border: '1px solid rgba(27, 42, 74, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              margin: '0 auto 28px',
            }}>
              📄
            </div>
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 800,
              fontSize: 'clamp(24px, 5vw, 32px)',
              color: tk.text,
              marginBottom: '12px',
            }}>
              Article Not Found
            </h1>
            <p style={{
              color: tk.muted,
              fontSize: '16px',
              lineHeight: 1.6,
              marginBottom: '32px',
            }}>
              The article you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/articles"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '13px 28px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${tk.navy}, ${tk.navyLight})`,
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(27, 42, 74, 0.25)',
              }}
            >
              ← Back to Articles
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const wordCount = (article.content || '')
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
    .filter(Boolean).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  const dateStr = new Date(article.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <style>{`
        .ar-root {
          min-height: 100vh;
          background: ${tk.bg};
        }

        .ar-hero-wrap {
          position: relative;
          width: 100%;
          height: clamp(240px, 38vw, 480px);
          overflow: hidden;
          margin-top: 70px;
        }
        .ar-hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 30%;
          display: block;
        }
        .ar-hero-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(245, 243, 239, 0) 0%,
            rgba(245, 243, 239, 0.4) 55%,
            rgba(245, 243, 239, 0.95) 100%
          );
        }
        .ar-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(27, 42, 74, 0.12) 0%,
            transparent 60%
          );
        }

        .ar-main {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }
        .ar-layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 48px;
          align-items: flex-start;
          padding-top: 40px;
        }

        .ar-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: ${tk.faint};
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .ar-bc-link {
          color: ${tk.faint};
          text-decoration: none;
          transition: color 0.2s;
          padding: 2px 0;
        }
        .ar-bc-link:hover { color: ${tk.navy}; }

        .ar-meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .ar-cat-badge {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          color: ${tk.navy};
          background: rgba(27, 42, 74, 0.06);
          border: 1px solid rgba(27, 42, 74, 0.1);
          padding: 4px 12px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ar-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: ${tk.faint};
        }

        .ar-title {
          font-family: 'Playfair Display', serif;
          font-weight: 800;
          font-size: clamp(26px, 4vw, 44px);
          color: ${tk.text};
          line-height: 1.2;
          letter-spacing: -0.5px;
          margin-bottom: 24px;
        }

        .ar-excerpt {
          font-size: clamp(15px, 1.8vw, 17px);
          line-height: 1.75;
          color: ${tk.muted};
          font-style: italic;
          border-left: 4px solid ${tk.gold};
          padding: 16px 20px;
          background: rgba(232, 168, 56, 0.04);
          border-radius: 0 12px 12px 0;
          margin-bottom: 40px;
        }

        .ar-content {
          color: #374151;
          font-size: clamp(15px, 1.8vw, 17px);
          line-height: 1.85;
          font-family: 'DM Sans', sans-serif;
        }
        .ar-content h1 {
          font-family: 'Playfair Display', serif;
          font-weight: 800;
          font-size: clamp(22px, 3vw, 30px);
          color: ${tk.text};
          margin: 40px 0 16px;
          letter-spacing: -0.5px;
          line-height: 1.25;
        }
        .ar-content h2 {
          font-family: 'Playfair Display', serif;
          font-weight: 800;
          font-size: clamp(19px, 2.5vw, 26px);
          color: ${tk.text};
          margin: 36px 0 14px;
          padding-bottom: 10px;
          border-bottom: 2px solid rgba(27, 42, 74, 0.08);
          line-height: 1.3;
        }
        .ar-content h3 {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: clamp(17px, 2vw, 22px);
          color: ${tk.text};
          margin: 28px 0 10px;
          line-height: 1.35;
        }
        .ar-content h4 {
          font-weight: 700;
          font-size: clamp(15px, 1.5vw, 18px);
          color: ${tk.text};
          margin: 22px 0 8px;
        }
        .ar-content p { margin-bottom: 18px; }
        .ar-content ul, .ar-content ol {
          padding-left: 28px;
          margin-bottom: 18px;
        }
        .ar-content ul { list-style-type: disc; }
        .ar-content ol { list-style-type: decimal; }
        .ar-content li { margin-bottom: 8px; line-height: 1.7; }
        .ar-content li::marker { color: ${tk.gold}; }
        .ar-content strong, .ar-content b {
          color: #1a1a1a;
          font-weight: 700;
        }
        .ar-content em, .ar-content i { font-style: italic; }
        .ar-content u {
          text-decoration: underline;
          text-decoration-color: rgba(232, 168, 56, 0.5);
          text-underline-offset: 3px;
        }
        .ar-content a {
          color: ${tk.navy};
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s;
        }
        .ar-content a:hover { color: ${tk.gold}; }
        .ar-content blockquote {
          border-left: 4px solid ${tk.gold};
          padding: 14px 20px;
          margin: 24px 0;
          background: rgba(232, 168, 56, 0.04);
          border-radius: 0 12px 12px 0;
          color: ${tk.muted};
          font-style: italic;
          font-size: 15px;
        }
        .ar-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          font-size: 14px;
          border: 1px solid ${tk.border};
          border-radius: 12px;
          overflow: hidden;
        }
        .ar-content th {
          background: rgba(27, 42, 74, 0.05);
          color: ${tk.navy};
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 12px 14px;
          text-align: left;
          border-bottom: 2px solid ${tk.border};
        }
        .ar-content td {
          padding: 11px 14px;
          border-bottom: 1px solid #F3F4F6;
          color: #374151;
        }
        .ar-content tr:last-child td { border-bottom: none; }
        .ar-content tr:hover td { background: rgba(245, 243, 239, 0.8); }
        .ar-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 20px 0;
          border: 1px solid ${tk.border};
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          display: block;
        }
        .ar-content pre {
          background: ${tk.navy};
          color: #e2e8f0;
          padding: 20px;
          border-radius: 12px;
          overflow-x: auto;
          margin: 20px 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
        }
        .ar-content code {
          background: rgba(27, 42, 74, 0.06);
          color: ${tk.navy};
          padding: 2px 7px;
          border-radius: 5px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.88em;
          border: 1px solid rgba(27, 42, 74, 0.08);
        }
        .ar-content pre code {
          background: none;
          color: inherit;
          padding: 0;
          border: none;
        }
        .ar-content hr {
          border: none;
          height: 1px;
          margin: 36px 0;
          background: linear-gradient(90deg, transparent, ${tk.border}, transparent);
        }

        .ar-bottom-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 56px;
          padding-top: 28px;
          border-top: 1px solid ${tk.border};
        }

        @media (max-width: 960px) {
          .ar-layout { grid-template-columns: 1fr; }
          .ar-sidebar { display: none; }
        }
        @media (max-width: 640px) {
          .ar-main { padding: 0 16px 60px; }
          .ar-layout { padding-top: 24px; gap: 32px; }
          .ar-hero-wrap { height: clamp(180px, 50vw, 280px); }
          .ar-title { font-size: 24px; }
          .ar-bottom-row {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>

      {/* ── Client-side Reading Progress ── */}
      <ReadingProgress />

      <div className="ar-root">
        <Navbar />

        {/* ── Hero Image ── */}
        {article.thumbnail && (
          <div className="ar-hero-wrap">
            <img
              src={article.thumbnail}
              alt={article.title}
              className="ar-hero-img"
            />
            <div className="ar-hero-gradient" />
            <div className="ar-hero-overlay" />
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="ar-main" style={{
          paddingTop: article.thumbnail ? '0' : '110px',
        }}>
          <div className="ar-layout">

            {/* ── Article Column ── */}
            <article>

              {/* Breadcrumb */}
              <div className="ar-breadcrumb">
                <Link href="/" className="ar-bc-link">🏠 Home</Link>
                <span style={{ color: tk.border }}>›</span>
                <Link href="/articles" className="ar-bc-link">Articles</Link>
                <span style={{ color: tk.border }}>›</span>
                <span style={{
                  color: tk.muted,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '220px',
                }}>
                  {article.title}
                </span>
              </div>

              {/* Meta */}
              <div className="ar-meta-row">
                {article.category && (
                  <span className="ar-cat-badge">{article.category}</span>
                )}
                <span className="ar-meta-item">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {dateStr}
                </span>
                <span className="ar-meta-item">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {readingTime} min read
                </span>
               
              </div>

              {/* Title */}
              <h1 className="ar-title">{article.title}</h1>

              {/* Excerpt */}
              {article.excerpt && (
                <div className="ar-excerpt">{article.excerpt}</div>
              )}

              {/* Divider */}
              <div style={{
                height: '1px',
                background: `linear-gradient(90deg, ${tk.gold}, rgba(232, 168, 56, 0.2), transparent)`,
                marginBottom: '36px',
              }} />

              {/* Content */}
              <div
                className="ar-content"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* ── Premium CTA ── */}
              <div style={{
                background: `linear-gradient(135deg, ${tk.navy} 0%, ${tk.navyLight} 100%)`,
                border: `1px solid rgba(232, 168, 56, 0.15)`,
                borderRadius: '20px',
                padding: '32px',
                marginTop: '48px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `
                    linear-gradient(rgba(232, 168, 56, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(232, 168, 56, 0.05) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                  pointerEvents: 'none',
                }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>⭐</div>
                  <h3 style={{
                    fontFamily: 'Playfair Display, serif',
                    fontWeight: 800,
                    fontSize: '20px',
                    color: '#FFFFFF',
                    marginBottom: '8px',
                  }}>
                    Unlock Premium Video Lectures
                  </h3>
                  <p style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '14px',
                    marginBottom: '24px',
                    lineHeight: 1.65,
                    maxWidth: '400px',
                    margin: '0 auto 24px',
                  }}>
                    Get full access to 200+ topic-wise expert video lectures for just
                    ₹999 / 4 months.
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}>
                    <Link
                      href="/premium"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${tk.gold}, ${tk.goldDark})`,
                        color: tk.navy,
                        fontWeight: 700,
                        fontSize: '14px',
                        textDecoration: 'none',
                        boxShadow: '0 6px 20px rgba(232, 168, 56, 0.3)',
                      }}
                    >
                      Get Premium Access →
                    </Link>
                    <Link
                      href="/classes"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 600,
                        fontSize: '14px',
                        textDecoration: 'none',
                      }}
                    >
                      Browse Classes
                    </Link>
                  </div>
                </div>
              </div>

              {/* ── Bottom Nav ── */}
              <div className="ar-bottom-row">
                <Link
                  href="/articles"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.8)',
                    border: `1px solid ${tk.border}`,
                    color: tk.text,
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  ← Back to Articles
                </Link>
                <Link
                  href="/premium"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${tk.gold}, ${tk.goldDark})`,
                    color: tk.navy,
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(232, 168, 56, 0.25)',
                  }}
                >
                  ⭐ Unlock Premium Videos
                </Link>
              </div>
            </article>

            {/* ── Sidebar ── */}
            <aside className="ar-sidebar">

              <ArticleTOC content={article.content} />

              {/* Article Info */}
              <div style={{
                background: tk.card,
                border: `1px solid ${tk.border}`,
                borderRadius: '18px',
                padding: '20px',
                marginTop: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <p style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: tk.gold,
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Article Info
                </p>
                {[
                  { icon: '📅', label: 'Published', value: dateStr },
                  { icon: '⏱️', label: 'Read Time', value: `${readingTime} min` },
                  
                  ...(article.category
                    ? [{ icon: '🏷️', label: 'Category', value: article.category }]
                    : []),
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #F3F4F6',
                  }}>
                    <span style={{ fontSize: '12px', color: tk.faint }}>
                      {item.icon} {item.label}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: tk.text,
                      textAlign: 'right',
                      maxWidth: '140px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Premium mini CTA */}
              <div style={{
                background: `linear-gradient(135deg, ${tk.navy}, ${tk.navyLight})`,
                border: '1px solid rgba(232, 168, 56, 0.15)',
                borderRadius: '18px',
                padding: '24px 20px',
                marginTop: '20px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(232, 168, 56, 0.08)',
                  pointerEvents: 'none',
                }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: '28px', marginBottom: '10px' }}>⭐</div>
                  <p style={{
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#FFFFFF',
                    marginBottom: '6px',
                  }}>
                    Get Premium Access
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.45)',
                    marginBottom: '16px',
                    lineHeight: 1.5,
                  }}>
                    200+ expert video lectures for ₹999
                  </p>
                  <Link
                    href="/premium"
                    style={{
                      display: 'block',
                      padding: '10px',
                      borderRadius: '11px',
                      background: `linear-gradient(135deg, ${tk.gold}, ${tk.goldDark})`,
                      color: tk.navy,
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(232, 168, 56, 0.3)',
                    }}
                  >
                    Subscribe Now →
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}

/* ── Table of Contents ── */
function ArticleTOC({ content }) {
  if (!content) return null

  const headingRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gi
  const headings = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1])
    const text = match[2].replace(/<[^>]*>/g, '').trim()
    if (text) headings.push({ level, text })
  }

  if (headings.length < 2) return null

  return (
    <div style={{
      position: 'sticky',
      top: '88px',
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '18px',
      padding: '20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      maxHeight: '60vh',
      overflowY: 'auto',
    }}>
      <p style={{
        fontSize: '10px',
        fontWeight: 800,
        color: '#E8A838',
        textTransform: 'uppercase',
        letterSpacing: '1.2px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h10M4 18h6" />
        </svg>
        Contents
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {headings.map((h, i) => (
          <a
            key={i}
            href={`#heading-${i}`}
            style={{
              display: 'block',
              fontSize: h.level === 2 ? '13px' : '12px',
              color: '#6B7280',
              textDecoration: 'none',
              padding: '5px 0',
              paddingLeft: h.level === 3 ? '16px' : '0',
              borderLeft: '2px solid transparent',
              marginLeft: '-2px',
              transition: 'all 0.15s ease',
              lineHeight: 1.4,
              fontWeight: h.level === 2 ? 600 : 400,
            }}
          >
            {h.text.length > 44
              ? h.text.substring(0, 44) + '…'
              : h.text}
          </a>
        ))}
      </div>
    </div>
  )
}