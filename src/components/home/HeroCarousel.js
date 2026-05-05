// src/components/home/HeroCarousel.js
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function useBreakpoint() {
  const [bp, setBp] = useState('desktop')
  useEffect(() => {
    function check() {
      const w = window.innerWidth
      setBp(w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return bp
}

const TOPIC_ICONS = {
  'office procedure':'📋','service rules':'⚖️','financial rules':'💰',
  'acts & statutes':'📜','general knowledge':'🌐','english grammar':'✍️',
  'current affairs':'📰','model q&a':'❓',
}
function getTopicIcon(name) { return TOPIC_ICONS[name?.toLowerCase()] || '📚' }

/* ─────────────────────────────────────────
   DEFAULT HERO
───────────────────────────────────────── */
function DefaultHero({ bp }) {
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  return (
    <section style={{
      position: 'relative',
      minHeight: isMobile ? '100svh' : isTablet ? '80vh' : '90vh',
      overflow: 'hidden',
      background: '#FFFFFF',
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @keyframes hFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes hPulse{0%,100%{opacity:1}50%{opacity:.35}}
      `}</style>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        padding: isMobile ? '100px 20px 80px' : isTablet ? '100px 32px 72px' : '80px 48px 60px',
        maxWidth: '1320px', margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ maxWidth: isMobile ? '100%' : isTablet ? '520px' : '600px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 18px', borderRadius: '999px',
            background: 'rgba(27,42,74,.06)', border: '1px solid rgba(27,42,74,.1)',
            marginBottom: isMobile ? '20px' : '26px',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#E8A838', animation: 'hPulse 2s ease infinite' }}/>
            <span style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: 700, color: '#1B2A4A', letterSpacing: '1.4px', textTransform: 'uppercase' }}>
              LDCE Preparation Platform
            </span>
          </div>
          <h1 style={{
            fontFamily: 'Playfair Display,serif', fontWeight: 800,
            fontSize: isMobile ? 'clamp(34px,9vw,44px)' : isTablet ? 'clamp(42px,6vw,56px)' : 'clamp(52px,5vw,70px)',
            lineHeight: 1.06, letterSpacing: '-1.5px',
            marginBottom: isMobile ? '18px' : '22px',
            animation: 'hFadeUp .7s ease .15s both',
          }}>
            <span style={{ color: '#1B2A4A', display: 'block' }}>Master Your</span>
            <span style={{
              background: 'linear-gradient(135deg,#E8A838,#D4922A)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', display: 'block',
            }}>LDCE Exam</span>
          </h1>
          <p style={{
            color: '#4B5563',
            fontSize: isMobile ? '14px' : isTablet ? '15px' : 'clamp(15px,1.6vw,18px)',
            lineHeight: 1.75, maxWidth: '480px',
            marginBottom: isMobile ? '32px' : '40px',
            animation: 'hFadeUp .7s ease .28s both',
          }}>
            Comprehensive study material, video lectures, and expert guidance
            designed for your departmental success.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', animation: 'hFadeUp .7s ease .4s both' }}>
            <Link href="/classes" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: isMobile ? '13px 26px' : '15px 32px', borderRadius: '13px',
              background: 'linear-gradient(135deg,#1B2A4A,#243656)',
              color: '#fff', fontWeight: 700, fontSize: isMobile ? '14px' : '15px',
              textDecoration: 'none',
            }}>Start Learning →</Link>
            <Link href="/premium" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: isMobile ? '13px 26px' : '15px 32px', borderRadius: '13px',
              background: 'linear-gradient(135deg,#E8A838,#D4922A)',
              color: '#1B2A4A', fontWeight: 700, fontSize: isMobile ? '14px' : '15px',
              textDecoration: 'none',
            }}>⭐ Get Premium</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────
   TOPIC SCROLL PANEL (Desktop/Tablet RIGHT SIDE)
───────────────────────────────────────── */
function TopicScrollPanel({ topics, isTablet }) {
  const router = useRouter()
  const [paused, setPaused] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)

  if (topics.length === 0) return null

  const doubled = [...topics, ...topics]
  const cardH = 320
  const totalScrollH = topics.length * cardH

  function handleClick(topic) {
    router.push(`/classes?topic=${topic._id}`)
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setHoveredId(null) }}
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', minHeight: 0, overflow: 'hidden',
        background: '#FFFFFF',
        borderLeft: '1px solid #E5E7EB',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes heroTopicScroll {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-${totalScrollH}px); }
        }
        .hero-topic-marquee {
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: heroTopicScroll ${topics.length * 5}s linear infinite;
        }
        .hero-topic-marquee.paused {
          animation-play-state: paused;
        }
        .hero-tc {
          flex-shrink: 0;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }
        .hero-tc:hover {
          border-color: #E8A838;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .hero-tc-thumb {
          position: relative;
          width: 100%;
          background: #F9FAFB;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-tc-info {
          padding: 14px 16px 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: isTablet ? '14px 16px 10px' : '18px 20px 14px',
        borderBottom: '1px solid #E5E7EB',
        flexShrink: 0, background: '#FFFFFF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%', background: '#E8A838',
            boxShadow: '0 0 8px rgba(232,168,56,0.5)',
          }}/>
          <span style={{
            fontSize: '10px', fontWeight: 700, color: '#1B2A4A',
            letterSpacing: '1.8px', textTransform: 'uppercase',
          }}>Premium Topics</span>
        </div>
        <p style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.4 }}>
          Click any topic to explore videos
        </p>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', padding: '0 14px' }}>
        <div className={`hero-topic-marquee ${paused ? 'paused' : ''}`} style={{ paddingTop: '16px' }}>
          {doubled.map((topic, idx) => {
            const icon = getTopicIcon(topic.name)
            const isHov = hoveredId === `${topic._id}-${idx}`
            return (
              <div
                key={`${topic._id}-${idx}`}
                className="hero-tc"
                onClick={() => handleClick(topic)}
                onMouseEnter={() => setHoveredId(`${topic._id}-${idx}`)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="hero-tc-thumb">
                  {topic.thumbnail ? (
                    <img src={topic.thumbnail} alt={topic.name} style={{
                      width: '100%', height: 'auto', maxHeight: '350px',
                      objectFit: 'contain', padding: '8px',
                      transition: 'transform 0.4s ease',
                      transform: isHov ? 'scale(1.03)' : 'scale(1)',
                    }} />
                  ) : (
                    <div style={{ width: '100%', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', background: '#F5F3EF' }}>{icon}</div>
                  )}
                  <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', fontWeight: 700, color: '#6B7280', background: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: '999px', border: '1px solid #EEE' }}>{topic.videoCount || 0} Videos</div>
                </div>
                <div className="hero-tc-info">
                  <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '14px', color: '#1A1D23', textAlign: 'center' }}>{topic.name}</h3>
                  <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#E8A838' }}>View Videos →</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MOBILE TOPIC MARQUEE (Horizontal Auto-Scroll)
───────────────────────────────────────── */
function MobileTopicMarquee({ topics }) {
  const router = useRouter()
  const [paused, setPaused] = useState(false)

  if (topics.length === 0) return null

  // Triple clone for seamless loop
  const tripled = [...topics, ...topics, ...topics]
  const cardW = 110
  const totalW = topics.length * (cardW + 10)

  return (
    <div style={{
      background: '#FFFFFF',
      borderTop: '1px solid #E5E7EB',
      paddingBottom: '4px',
      overflow: 'hidden',   // ← keeps marquee from bleeding out of its lane
    }}>
      <style>{`
        @keyframes mobileTopicScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-${totalW}px); }
        }
        .mobile-topic-marquee-track {
          display: flex;
          flex-direction: row;
          gap: 10px;
          /* ← FIXED: symmetric padding so last card never clips against the edge */
          padding: 10px 10px 10px 10px;
          animation: mobileTopicScroll ${topics.length * 3.5}s linear infinite;
          width: max-content;
        }
        .mobile-topic-marquee-track.paused {
          animation-play-state: paused;
        }
        .mobile-topic-card {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: ${cardW}px;
          padding: 8px 6px 10px;
          border-radius: 14px;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .mobile-topic-card:active {
          border-color: #E8A838;
          box-shadow: 0 4px 12px rgba(232,168,56,0.2);
          transform: scale(0.97);
        }
      `}</style>

      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '10px 14px 6px',
      }}>
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: '#E8A838', boxShadow: '0 0 6px rgba(232,168,56,0.6)',
          flexShrink: 0,
        }}/>
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#1B2A4A', letterSpacing: '1.6px', textTransform: 'uppercase' }}>
          Topics · Tap to Explore
        </span>
      </div>

      {/* Scrolling track */}
      <div
        style={{ overflow: 'hidden', position: 'relative' }}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div className={`mobile-topic-marquee-track ${paused ? 'paused' : ''}`}>
          {tripled.map((topic, idx) => {
            const icon = getTopicIcon(topic.name)
            return (
              <div
                key={`mob-${topic._id}-${idx}`}
                className="mobile-topic-card"
                onClick={() => router.push(`/classes?topic=${topic._id}`)}
              >
                {/* Thumbnail or Icon */}
                <div style={{
                  width: '56px', height: '56px', borderRadius: '10px',
                  overflow: 'hidden', background: '#F5F3EF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {topic.thumbnail ? (
                    <img
                      src={topic.thumbnail}
                      alt={topic.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '26px' }}>{icon}</span>
                  )}
                </div>

                {/* Name */}
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: '#1B2A4A',
                  textAlign: 'center', lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  width: '100%',
                }}>
                  {topic.name}
                </span>

                {/* Video count badge */}
                <span style={{
                  fontSize: '9px', fontWeight: 600, color: '#E8A838',
                  background: 'rgba(232,168,56,0.1)',
                  padding: '2px 7px', borderRadius: '999px',
                  border: '1px solid rgba(232,168,56,0.25)',
                }}>
                  {topic.videoCount || 0} Videos
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
export default function HeroCarousel({ slides = [], topics = [] }) {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'

  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [videoError, setVideoError] = useState(false)

  const videoRef = useRef(null)
  const timerRef = useRef(null)
  const scrollRef = useRef(0)

  const safeSetCurrent = useCallback((nextFn) => {
    scrollRef.current = window.scrollY
    setCurrent(prev => typeof nextFn === 'function' ? nextFn(prev) : nextFn)
  }, [])

  useEffect(() => {
    if (scrollRef.current > 10) {
      requestAnimationFrame(() => window.scrollTo(0, scrollRef.current))
    }
  }, [current])

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current)
    if (slides.length <= 1) return
    timerRef.current = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        safeSetCurrent(c => (c + 1) % slides.length)
        setIsTransitioning(false)
        setImageLoaded(false); setVideoReady(false); setVideoError(false)
      }, 380)
    }, 7000)
  }, [slides.length, safeSetCurrent])

  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current) }, [startTimer])

  function goTo(idx) {
    if (isTransitioning || idx === current) return
    clearInterval(timerRef.current)
    setIsTransitioning(true)
    setTimeout(() => {
      safeSetCurrent(idx)
      setIsTransitioning(false)
      setImageLoaded(false); setVideoReady(false); setVideoError(false)
    }, 380)
    startTimer()
  }

  if (slides.length === 0) return <DefaultHero bp={bp} />

  const slide = slides[current]
  const isVideo = slide?.type === 'video'
  const rightPx = isTablet ? 280 : 420

  const sectionHeight = isMobile ? 'auto' : isTablet ? '80vh' : '90vh'

  return (
    <section style={{
      position: 'relative',
      height: sectionHeight,
      minHeight: isMobile ? 'unset' : undefined,
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      contain: isMobile ? 'none' : 'layout style',
      // ← FIXED: push content below the fixed navbar on mobile (60px tall)
      paddingTop: isMobile ? '60px' : 0,
    }}>
      <style>{`
        @keyframes hFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes hImageIn{from{opacity:0;transform:scale(1.02)}to{opacity:1;transform:scale(1)}}
        @keyframes hPulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes hSpin{to{transform:rotate(360deg)}}
        .hero-arrow{
          position:absolute; top:50%; transform:translateY(-50%);
          width:32px; height:32px; border-radius:50%;
          background:#FFF; border:1px solid #EEE;
          color:#1B2A4A; font-size:14px; display:flex; align-items:center; justify-content:center;
          cursor:pointer; z-index:20; transition:all 0.2s;
          box-shadow:0 4px 12px rgba(0,0,0,0.08);
        }
        .hero-arrow:hover{ background:#E8A838; border-color:#E8A838; color:#FFF; }
      `}</style>

      {/* ── MAIN ROW (media + right panel) ── */}
      <div style={{
        display: 'flex',
        flex: isMobile ? 'unset' : 1,
        minHeight: 0,
        flexDirection: 'row',
      }}>

        {/* LEFT / FULL-WIDTH on mobile: Media */}
        <div style={{
          flex: 1,
          position: 'relative',
          background: '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'center' : 'left',
          // ← FIXED: removed extra top padding on mobile since section handles it now
          padding: isMobile ? '12px 14px 14px' : isTablet ? '28px' : '40px',
        }}>

          {/* Media box */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: isMobile ? '100%' : '1050px',
            aspectRatio: '16/9',
            background: '#FFF',
            borderRadius: isMobile ? '16px' : '24px',
            boxShadow: isMobile
              ? '0 8px 24px rgba(0,0,0,0.08)'
              : '0 20px 50px rgba(0,0,0,0.1)',
            overflow: 'visible',
          }}>

            {/* Arrows: tablet + desktop only */}
            {slides.length > 1 && !isMobile && (
              <>
                <button className="hero-arrow" style={{ left: '-16px' }} onClick={() => goTo((current - 1 + slides.length) % slides.length)}>‹</button>
                <button className="hero-arrow" style={{ right: '-16px' }} onClick={() => goTo((current + 1) % slides.length)}>›</button>
              </>
            )}

            {/* Media content */}
            <div style={{
              width: '100%', height: '100%',
              borderRadius: isMobile ? '16px' : '24px',
              overflow: 'hidden',
              opacity: isTransitioning ? 0 : 1,
              transition: 'opacity 0.4s ease',
            }}>
              {isVideo ? (
                <video
                  ref={videoRef}
                  key={slide.mediaUrl}
                  src={slide.mediaUrl}
                  autoPlay muted loop playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onCanPlay={() => setVideoReady(true)}
                />
              ) : (
                <img
                  key={slide.mediaUrl}
                  src={slide.mediaUrl}
                  alt=""
                  onLoad={() => setImageLoaded(true)}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    animation: imageLoaded ? 'hImageIn .8s ease both' : 'none',
                  }}
                />
              )}

              {/* Text overlay card */}
              <div style={{
                position: 'absolute',
                bottom: isMobile ? '10px' : '20px',
                left: isMobile ? '10px' : '20px',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                padding: isMobile ? '10px 14px' : '15px 25px',
                borderRadius: isMobile ? '12px' : '18px',
                maxWidth: isMobile ? '200px' : '280px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid #F0F0F0',
              }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#E8A838', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>LDCE PREP</span>
                <h2 style={{
                  fontSize: isMobile ? '14px' : '22px',
                  fontWeight: 800, color: '#1B2A4A',
                  margin: 0, fontFamily: 'Playfair Display, serif',
                }}>{slide.title}</h2>
                {!isMobile && (
                  <Link href="/classes" style={{ display: 'inline-block', marginTop: '10px', padding: '7px 15px', background: '#F3F4F6', borderRadius: '8px', color: '#1B2A4A', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>Browse Classes</Link>
                )}
              </div>

              {/* Slide counter */}
              {slides.length > 1 && (
                <div style={{
                  position: 'absolute',
                  top: isMobile ? '8px' : '20px',
                  right: isMobile ? '8px' : '20px',
                  background: 'rgba(255,255,255,0.9)',
                  padding: isMobile ? '3px 8px' : '5px 12px',
                  borderRadius: '20px',
                  fontSize: isMobile ? '10px' : '12px',
                  fontWeight: 800, color: '#1B2A4A',
                }}>
                  {current + 1} / {slides.length}
                </div>
              )}
            </div>
          </div>

          {/* Mobile: dot nav below image */}
          {isMobile && slides.length > 1 && (
            <div style={{
              position: 'absolute', bottom: '6px', left: 0, right: 0,
              display: 'flex', justifyContent: 'center', gap: '5px',
            }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    width: i === current ? '18px' : '6px',
                    height: '6px', borderRadius: '3px',
                    background: i === current ? '#E8A838' : 'rgba(27,42,74,0.25)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: vertical topic scroll — tablet + desktop only */}
        {!isMobile && topics.length > 0 && (
          <div style={{ width: `${rightPx}px`, height: '100%', flexShrink: 0 }}>
            <TopicScrollPanel topics={topics} isTablet={isTablet} />
          </div>
        )}
      </div>

      {/* MOBILE: horizontal auto-scrolling topic marquee */}
      {isMobile && topics.length > 0 && (
        <MobileTopicMarquee topics={topics} />
      )}
    </section>
  )
}