// src/components/home/ArticleCard.js
'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ArticleCard({ article }) {
  const [hovered, setHovered] = useState(false)
  const articleId = article._id || article.id
  const date = new Date(article.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '10px',
        overflow: 'hidden',
        background: '#FFFFFF',
        border: hovered
          ? '1px solid rgba(232, 168, 56, 0.3)'
          : '1px solid #E5E7EB',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        
      }}
    >
      {/* ── Thumbnail ── */}
      {article.thumbnail && (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '200px',       // fixed height — no whitespace
          overflow: 'hidden',
          flexShrink: 0,
         // fallback while loading
        }}>
          <img
            src={article.thumbnail}
            alt={article.title}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'inherit',        // ← FIXED: fills the box, no whitespace
              objectPosition: 'center', // show top of image (titles/headers)
              display: 'block',
              transition: 'transform 0.5s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
          {/* Bottom gradient */}
          <div style={{
            position: 'absolute',
            inset: 0,
          
            pointerEvents: 'none',
          }} />

          {/* Category badge on top of image */}
          {article.category && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '12px',
              zIndex: 2,
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#FFFFFF',
                background: 'rgba(27, 42, 74, 0.72)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                padding: '3px 10px',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                display: 'inline-block',
              }}>
                {article.category}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Card Body ── */}
      <div style={{
        padding: '16px 18px 18px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        {/* Category pill (when no thumbnail) */}
        {!article.thumbnail && article.category && (
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#1B2A4A',
            background: 'rgba(27, 42, 74, 0.06)',
            border: '1px solid rgba(27, 42, 74, 0.1)',
            padding: '4px 10px',
            borderRadius: '999px',
            display: 'inline-block',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            alignSelf: 'flex-start',
          }}>
            {article.category}
          </span>
        )}

        {/* Title */}
        <h3 style={{
          fontWeight: 700,
          color: hovered ? '#1B2A4A' : '#1A1D23',
          fontSize: '15px',
          lineHeight: 1.45,
          marginBottom: '8px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          transition: 'color 0.2s ease',
        }}>
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.excerpt && (
          <p style={{
            color: '#6B7280',
            fontSize: '13px',
            lineHeight: 1.65,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '16px',
            flex: 1,
          }}>
            {article.excerpt}
          </p>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '14px',
          borderTop: '1px solid #E5E7EB',
          marginTop: 'auto',
        }}>
          <span style={{
            fontSize: '12px',
            color: '#9CA3AF',
          }}>{date}</span>
          <Link
            href={`/articles/${articleId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: hovered ? '8px' : '4px',
              fontSize: '12px',
              color: '#E8A838',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'gap 0.2s ease',
            }}
          >
            Read More
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}