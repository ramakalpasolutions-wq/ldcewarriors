// src/components/home/VideoCard.js
'use client'
import { useState } from 'react'

export default function VideoCard({ video, onClick, isSubscribed = false }) {
  const [hovered, setHovered] = useState(false)
  const videoId = video._id || video.id

  const storageKey     = `ldce_plays_${videoId}`
  const localPlayCount = typeof window !== 'undefined'
    ? parseInt(localStorage.getItem(storageKey) || '0') : 0
  const playLimit      = video.playLimit || 3
  const isPremium      = video.type === 'premium'

  // Only show limit UI if user is actually subscribed — prevents stale localStorage
  // from showing "Play limit reached" to logged-out or non-subscribed users
  const isLimitReached = isPremium && isSubscribed && localPlayCount >= playLimit

  return (
    <>
      <style>{`
        .vc-root {
          border-radius: 14px; overflow: hidden;
          background: #FFFFFF;
          border: 1.5px solid #E5E7EB;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          display: flex; flex-direction: column;
          position: relative;
        }
        .vc-root:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.09);
          border-color: rgba(232,168,56,0.35);
        }
        .vc-root.limit {
          opacity: 0.72;
        }

        /* ── Thumbnail ── */
        .vc-thumb {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: #F3F4F6;
        }
        .vc-thumb img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.45s ease;
          display: block;
        }
        .vc-root:hover .vc-thumb img {
          transform: scale(1.06);
        }

        /* Subtle gradient at bottom of thumb */
        .vc-thumb-grad {
          position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(to top, rgba(0,0,0,0.22), transparent);
          pointer-events: none;
        }

        /* ── Type badge ── */
        .vc-badge {
          position: absolute; top: 10px; left: 10px;
          padding: 4px 10px; border-radius: 999px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.3px;
          display: inline-flex; align-items: center; gap: 4px;
          line-height: 1;
          z-index: 3;
        }
        .vc-badge.premium {
          background: linear-gradient(135deg,#E8A838,#D4922A);
          color: #1B2A4A;
        }
        .vc-badge.free {
          background: rgba(42,157,143,0.92);
          color: #fff;
        }

        /* ── Duration ── */
        .vc-duration {
          position: absolute; bottom: 8px; right: 8px;
          background: rgba(15,20,30,0.75);
          color: #fff; font-size: 10px; font-weight: 600;
          padding: 3px 7px; border-radius: 6px;
          backdrop-filter: blur(4px);
          z-index: 3;
        }

        /* ── Play button ── */
        .vc-play {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.25s ease;
          z-index: 4; pointer-events: none;
        }
        .vc-root:hover .vc-play { opacity: 1; }
        .vc-play-circle {
          width: 48px; height: 48px; border-radius: 50%;
          background: rgba(27,42,74,0.88);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
          backdrop-filter: blur(6px);
          transition: transform 0.2s ease;
        }
        .vc-root:hover .vc-play-circle { transform: scale(1.08); }

        /* ── Info ── */
        .vc-info {
          padding: 12px 14px 14px;
          display: flex; flex-direction: column; gap: 8px;
          flex: 1;
        }
        .vc-title {
          font-size: 13px; font-weight: 700;
          color: #1A1D23; line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 0;
          transition: color 0.2s;
        }
        .vc-root:hover .vc-title { color: #1B2A4A; }
        .vc-title.limit-color { color: #9CA3AF; }

        .vc-meta {
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 6px; flex-wrap: wrap;
          margin-top: auto;
        }
        .vc-topic-chip {
          font-size: 10px; font-weight: 600; color: #1B2A4A;
          background: rgba(27,42,74,0.06);
          border: 1px solid rgba(27,42,74,0.1);
          padding: 3px 9px; border-radius: 999px;
          white-space: nowrap; max-width: 140px;
          overflow: hidden; text-overflow: ellipsis;
        }
        .vc-plays-dots {
          display: flex; gap: 3px; align-items: center;
        }
        .vc-dot {
          width: 6px; height: 6px; border-radius: 50%;
        }

        /* ── Overlays ── */
        .vc-overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 6px; z-index: 5; border-radius: 14px;
          backdrop-filter: blur(3px);
          background: rgba(245,243,239,0.82);
        }
        .vc-overlay-icon { font-size: 28px; }
        .vc-overlay-title {
          font-size: 12px; font-weight: 700; color: #1B2A4A;
          text-align: center;
        }
        .vc-overlay-sub {
          font-size: 10px; color: #6B7280; text-align: center;
        }
        .vc-overlay.exhausted .vc-overlay-title { color: #EF4444; }
      `}</style>

      <div
        className={`vc-root${isLimitReached ? ' limit' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onClick?.({ ...video, _id: videoId })}
      >
        {/* ── Thumbnail ── */}
        <div className="vc-thumb">
          <img
            src={video.thumbnail || 'https://via.placeholder.com/640x360/1B2A4A/E8A838?text=LDCE+Video'}
            alt={video.title}
          />
          <div className="vc-thumb-grad"/>

          {/* Type badge */}
          <div className={`vc-badge ${isPremium ? 'premium' : 'free'}`}>
            {isPremium ? <><span>⭐</span> Premium</> : 'FREE'}
          </div>

          {/* Duration */}
          {video.duration && (
            <div className="vc-duration">{video.duration}</div>
          )}

          {/* Play button — only when not locked and not limit reached */}
          {!video.isLocked && !isLimitReached && (
            <div className="vc-play">
              <div className="vc-play-circle">
                <svg width="20" height="20" fill="#E8A838" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          )}

          {/* Locked: premium but not subscribed */}
          {video.isLocked && !isLimitReached && (
            <div className="vc-overlay">
              <div className="vc-overlay-icon">🔒</div>
              <div className="vc-overlay-title">Premium Content</div>
              <div className="vc-overlay-sub">Subscribe to unlock</div>
            </div>
          )}

          {/* Play limit exhausted — only shown to subscribed users */}
          {isLimitReached && (
            <div className="vc-overlay exhausted">
              <div className="vc-overlay-icon">🚫</div>
              <div className="vc-overlay-title exhausted">Play limit reached</div>
              <div className="vc-overlay-sub">All {playLimit} plays used</div>
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="vc-info">
          <h3 className={`vc-title${isLimitReached ? ' limit-color' : ''}`}>
            {video.title}
          </h3>

          <div className="vc-meta">
            {(video.topicId?.name || video.topic?.name) && (
              <span className="vc-topic-chip">
                {video.topicId?.name || video.topic?.name}
              </span>
            )}

            {/* Play dots — only shown to subscribed users with some plays used */}
            {isPremium && isSubscribed && !video.isLocked && localPlayCount > 0 && (
              <div className="vc-plays-dots">
                {Array(playLimit).fill(null).map((_, i) => (
                  <div
                    key={i}
                    className="vc-dot"
                    style={{ background: i < localPlayCount ? '#E8A838' : '#E5E7EB' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}