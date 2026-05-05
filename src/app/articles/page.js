// src/app/articles/page.js
'use client'
import { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ArticleCard from '@/components/home/ArticleCard'

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

export default function ArticlesPage() {
  const [articles, setArticles] = useState([])
  const [filtered, setFiltered] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 0 })
  const [searchFocused, setSearchFocused] = useState(false)

  const fetchArticles = useCallback(async (pageNum = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/articles?limit=20&page=${pageNum}`)
      const data = await res.json()
      if (data.success) {
        setArticles(data.articles || [])
        setPagination(data.pagination || { total: 0, pages: 0 })
        const cats = [
          'All',
          ...new Set(data.articles.filter(a => a.category).map(a => a.category)),
        ]
        setCategories(cats)
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchArticles(page) }, [fetchArticles, page])

  useEffect(() => {
    let result = articles
    if (activeCategory !== 'All')
      result = result.filter(a => a.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.title?.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [activeCategory, search, articles])

  return (
    <>
      <style>{`
        .articles-root { min-height: 100vh; background: ${tk.bg}; }
        .articles-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 110px 24px 90px;
        }
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 1200px) {
          .articles-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
          .articles-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .articles-grid { grid-template-columns: 1fr; }
          .articles-container { padding: 90px 16px 60px; }
          .filter-row {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
          }
          .filter-row::-webkit-scrollbar { height: 0; }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div className="articles-root">
        <Navbar />

        <div className="articles-container">

          {/* ── Header ── */}
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: tk.teal,
              background: 'rgba(42, 157, 143, 0.08)',
              border: '1px solid rgba(42, 157, 143, 0.15)',
              padding: '5px 14px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              marginBottom: '16px',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: tk.teal,
              }} />
              Free for Everyone
            </span>

            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 800,
              fontSize: 'clamp(32px, 5vw, 52px)',
              color: tk.text,
              lineHeight: 1.15,
              marginBottom: '14px',
              letterSpacing: '-1px',
            }}>
              Exam{' '}
              <span style={{
                background: `linear-gradient(135deg, ${tk.navy}, ${tk.navyLight})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Articles & Guides
              </span>
            </h1>

            <p style={{
              color: tk.muted,
              fontSize: '16px',
              lineHeight: 1.7,
              maxWidth: '520px',
              margin: '0 auto',
            }}>
              Free access to expert articles, study guides, and strategies.
              No login required.
            </p>
          </div>

          {/* ── Search ── */}
          <div style={{
            marginBottom: '16px',
            position: 'relative',
            maxWidth: '520px',
          }}>
            <svg
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: tk.faint,
                pointerEvents: 'none',
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%',
                padding: '13px 16px 13px 46px',
                borderRadius: '13px',
                background: searchFocused ? '#FFFFFF' : '#FAFAF8',
                border: searchFocused
                  ? `1.5px solid ${tk.gold}`
                  : `1px solid ${tk.border}`,
                color: tk.text,
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.25s ease',
                boxShadow: searchFocused
                  ? '0 0 0 3px rgba(232, 168, 56, 0.1)'
                  : 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: tk.faint,
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                  padding: '4px',
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* ── Category Filters ── */}
          <div
            className="filter-row"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '28px',
            }}
          >
            {categories.map(cat => {
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: isActive ? 'none' : `1px solid ${tk.border}`,
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    background: isActive
                      ? `linear-gradient(135deg, ${tk.navy}, ${tk.navyLight})`
                      : 'rgba(255,255,255,0.8)',
                    color: isActive ? '#FFFFFF' : tk.muted,
                    boxShadow: isActive
                      ? '0 4px 12px rgba(27, 42, 74, 0.25)'
                      : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = tk.navy
                      e.currentTarget.style.borderColor = 'rgba(27, 42, 74, 0.2)'
                      e.currentTarget.style.background = 'rgba(27, 42, 74, 0.04)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = tk.muted
                      e.currentTarget.style.borderColor = tk.border
                      e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
                    }
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* ── Results count ── */}
          {!loading && (
            <p style={{
              color: tk.faint,
              fontSize: '13px',
              marginBottom: '20px',
            }}>
              Showing{' '}
              <span style={{ color: tk.navy, fontWeight: 600 }}>
                {filtered.length}
              </span>{' '}
              article{filtered.length !== 1 ? 's' : ''}
              {pagination.total > 0 && (
                <span> of {pagination.total} total</span>
              )}
            </p>
          )}

          {/* ── Grid ── */}
          {loading ? (
            <div className="articles-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: tk.card,
                  border: `1px solid ${tk.border}`,
                }}>
                  <div style={{
                    aspectRatio: '4/3',
                    background: '#F3F4F6',
                    animation: 'pulse 1.5s infinite',
                  }} />
                  <div style={{ padding: '16px' }}>
                    <div style={{
                      height: '10px',
                      background: '#F3F4F6',
                      borderRadius: '6px',
                      width: '30%',
                      marginBottom: '10px',
                      animation: 'pulse 1.5s infinite',
                    }} />
                    <div style={{
                      height: '14px',
                      background: '#F3F4F6',
                      borderRadius: '6px',
                      width: '80%',
                      marginBottom: '8px',
                      animation: 'pulse 1.5s infinite',
                    }} />
                    <div style={{
                      height: '12px',
                      background: '#E5E7EB',
                      borderRadius: '6px',
                      animation: 'pulse 1.5s infinite',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="articles-grid">
              {filtered.map(article => (
                <ArticleCard key={article._id} article={article} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '80px 24px',
            }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>📭</div>
              <h3 style={{
                color: tk.text,
                fontWeight: 700,
                fontSize: '20px',
                marginBottom: '8px',
              }}>
                No articles found
              </h3>
              <p style={{ color: tk.muted }}>
                {articles.length === 0
                  ? 'Articles are being written. Check back soon!'
                  : 'Try a different search term or category.'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    marginTop: '16px',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    background: 'rgba(27, 42, 74, 0.06)',
                    border: '1px solid rgba(27, 42, 74, 0.1)',
                    color: tk.navy,
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* ── Pagination ── */}
          {pagination.pages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '56px',
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.8)',
                  border: `1px solid ${tk.border}`,
                  color: page <= 1 ? tk.faint : tk.navy,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.2s ease',
                  opacity: page <= 1 ? 0.4 : 1,
                }}
              >
                ← Previous
              </button>

              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.2s ease',
                    background: page === i + 1
                      ? `linear-gradient(135deg, ${tk.navy}, ${tk.navyLight})`
                      : 'rgba(255,255,255,0.8)',
                    color: page === i + 1 ? '#FFFFFF' : tk.muted,
                    boxShadow: page === i + 1
                      ? '0 4px 12px rgba(27, 42, 74, 0.25)'
                      : 'none',
                  }}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.8)',
                  border: `1px solid ${tk.border}`,
                  color: page >= pagination.pages ? tk.faint : tk.navy,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: page >= pagination.pages ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.2s ease',
                  opacity: page >= pagination.pages ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}