// src/components/home/LiveScrollSidebar.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LiveScrollSidebar({ articles = [], fullHeight = false }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    if (articles.length === 0) return
    setItems([...articles, ...articles, ...articles])
  }, [articles])

  const containerStyle = {
    borderRadius: '16px',
    overflow: 'hidden',
    height: fullHeight ? '100%' : '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  }

  if (articles.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'linear-gradient(135deg, rgba(27, 42, 74, 0.04), rgba(232, 168, 56, 0.03))',
          flexShrink: 0,
        }}>
          <span style={{
            width: '10px', height: '10px',
            background: '#EF4444', borderRadius: '50%',
            animation: 'pulse 1.5s infinite',
          }} />
          <span style={{
            fontSize: '11px', fontWeight: 800,
            color: '#1B2A4A', textTransform: 'uppercase',
            letterSpacing: '1.5px',
          }}>Live Updates</span>
        </div>
        <div style={{
          flex: 1, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center' }}>
            No live updates yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes scrollUpLive{
          0%{transform:translateY(0)}
          100%{transform:translateY(-66.666%)}
        }
        .live-scroll-track-v2 {
          display: flex;
          flex-direction: column;
          animation: scrollUpLive 40s linear infinite;
        }
        .live-scroll-track-v2:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '16px 18px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'linear-gradient(135deg, #1B2A4A, #243656)',
        flexShrink: 0,
      }}>
        <span style={{
          width: '10px', height: '10px',
          background: '#EF4444', borderRadius: '50%',
          animation: 'pulse 1.5s infinite',
          flexShrink: 0,
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
        }} />
        <span style={{
          fontSize: '11px', fontWeight: 800,
          color: '#FFFFFF', textTransform: 'uppercase',
          letterSpacing: '1.5px',
        }}>Live Updates</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '11px', fontWeight: 700,
          color: '#E8A838',
          background: 'rgba(232, 168, 56, 0.15)',
          padding: '2px 8px', borderRadius: '999px',
        }}>
          {articles.length} new
        </span>
      </div>

      {/* Scroll area */}
      <div style={{
        flex: 1, overflow: 'hidden',
        position: 'relative', minHeight: 0,
      }}>
        <div className="live-scroll-track-v2" style={{ padding: '4px 0' }}>
          {items.map((article, idx) => {
            const articleId = article._id || article.id
            return (
              <Link
                key={`${articleId}-${idx}`}
                href={`/articles/${articleId}`}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  borderBottom: '1px solid #F3F4F6',
                  textDecoration: 'none',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(232, 168, 56, 0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                }}>
                  <div style={{
                    width: '6px', height: '6px',
                    borderRadius: '50%',
                    background: '#E8A838',
                    marginTop: '6px', flexShrink: 0,
                    opacity: 0.6,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '13px', color: '#1A1D23',
                      lineHeight: 1.5, fontWeight: 500,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {article.title}
                    </p>
                    <p style={{
                      fontSize: '11px', color: '#9CA3AF', marginTop: '4px',
                    }}>
                      {new Date(article.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #E5E7EB',
        flexShrink: 0,
        background: 'rgba(27, 42, 74, 0.02)',
      }}>
        <Link
          href="/articles"
          style={{
            fontSize: '12px', color: '#E8A838',
            fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center',
            gap: '4px', transition: 'gap 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.gap = '8px' }}
          onMouseLeave={e => { e.currentTarget.style.gap = '4px' }}
        >
          View all articles →
        </Link>
      </div>
    </div>
  )
}