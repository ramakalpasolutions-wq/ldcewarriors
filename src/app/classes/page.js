// src/app/classes/page.js
'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VideoCard from '@/components/home/VideoCard'
import VideoPlayerModal from '@/components/ui/VideoPlayerModal'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

const tk = {
  navy:'#1B2A4A', navyLight:'#243656', navyDark:'#12203A',
  gold:'#E8A838', goldDark:'#D4922A', goldLight:'#F0C060',
  teal:'#2A9D8F', tealLight:'#3BB5A6',
  bg:'#F5F3EF', card:'#FFFFFF',
  border:'#E5E7EB', text:'#1A1D23',
  muted:'#6B7280', faint:'#9CA3AF',
}

const TOPIC_ICONS = {
  'office procedure':'📋','service rules':'⚖️',
  'financial rules':'💰','acts & statutes':'📜',
  'general knowledge':'🌐','english grammar':'✍️',
  'current affairs':'📰','model q&a':'❓',
}
function getTopicIcon(name) { return TOPIC_ICONS[name?.toLowerCase()] || '📚' }

/* ─── Skeleton ─── */
function SkeletonCard() {
  return (
    <div style={{
      borderRadius:'14px', overflow:'hidden',
      background:tk.card, border:`1.5px solid ${tk.border}`,
    }}>
      <div style={{
        aspectRatio:'16/9',
        background:'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)',
        backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite',
      }}/>
      <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'8px' }}>
        <div style={{ height:'13px', borderRadius:'6px', width:'72%', background:'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }}/>
        <div style={{ height:'11px', borderRadius:'6px', width:'45%', background:'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }}/>
      </div>
    </div>
  )
}

/* ─── Skeleton for sidebar card ─── */
function SkeletonSidebarCard() {
  return (
    <div style={{
      borderRadius:'12px', overflow:'hidden',
      background:tk.card, border:`1px solid ${tk.border}`,
      flexShrink:0,
    }}>
      <div style={{
        aspectRatio:'16/9',
        background:'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)',
        backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite',
      }}/>
      <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:'6px' }}>
        <div style={{ height:'11px', borderRadius:'4px', width:'65%', background:'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }}/>
        <div style={{ height:'9px', borderRadius:'4px', width:'40%', background:'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }}/>
      </div>
    </div>
  )
}

/* ─── Play Count Badge ─── */
function PlayCountBadge({ videoId, playLimit = 3, serverCount = null }) {
  const [localCount, setLocalCount] = useState(0)
  useEffect(() => {
    if (serverCount === null && typeof window !== 'undefined')
      setLocalCount(parseInt(localStorage.getItem(`ldce_plays_${videoId}`) || '0'))
  }, [videoId, serverCount])

  const used = serverCount !== null ? serverCount : localCount
  const remaining = Math.max(0, playLimit - used)

  if (remaining <= 0) return (
    <span style={{
      fontSize:'10px', fontWeight:700, color:'#EF4444',
      background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
      padding:'3px 9px', borderRadius:'999px',
      display:'inline-flex', alignItems:'center', gap:'4px',
    }}>🔒 Limit reached ({used}/{playLimit})</span>
  )
  return (
    <span style={{
      fontSize:'10px', fontWeight:700,
      color: remaining <= 1 ? '#F59E0B' : tk.teal,
      background: remaining <= 1 ? 'rgba(245,158,11,0.1)' : 'rgba(42,157,143,0.1)',
      border:`1px solid ${remaining <= 1 ? 'rgba(245,158,11,0.25)' : 'rgba(42,157,143,0.25)'}`,
      padding:'3px 9px', borderRadius:'999px',
      display:'inline-flex', alignItems:'center', gap:'4px',
    }}>
      {remaining <= 1 ? '⚠️' : '▶'} {remaining}/{playLimit} plays left
    </span>
  )
}

/* ─── Section Label ─── */
function SectionLabel({ color, bg, border, children }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'5px',
      fontSize:'10px', fontWeight:700, color,
      background:bg, border:`1px solid ${border}`,
      padding:'4px 12px', borderRadius:'999px',
      letterSpacing:'0.4px', marginBottom:'8px',
    }}>{children}</span>
  )
}

/* ─── Tab Bar for mobile/tablet (Free vs Premium) ─── */
function SectionTabs({ activeTab, onTab }) {
  return (
    <div style={{
      display:'flex', gap:'6px',
      background:tk.card, border:`1.5px solid ${tk.border}`,
      borderRadius:'12px', padding:'5px',
      marginBottom:'20px',
    }}>
      {[
        { id:'free',    label:'🎬 Free Videos',   color:tk.teal },
        { id:'premium', label:'⭐ Premium Courses', color:tk.gold },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => onTab(tab.id)}
          style={{
            all:'unset', flex:1, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            gap:'5px', padding:'9px 12px', borderRadius:'9px',
            fontSize:'12px', fontWeight:700, lineHeight:1,
            transition:'all 0.22s ease',
            background: activeTab === tab.id
              ? `linear-gradient(135deg,${tk.navy},${tk.navyLight})`
              : 'transparent',
            color: activeTab === tab.id ? '#fff' : tk.muted,
            boxShadow: activeTab === tab.id
              ? '0 2px 10px rgba(27,42,74,0.18)' : 'none',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/* ─── Topic Chips (mobile/tablet) ─── */
function TopicChips({ topics, activeTopic, onSelect, isMobile }) {
  const trackRef = useRef(null)
  useEffect(() => {
    if (!trackRef.current || !activeTopic) return
    const active = trackRef.current.querySelector('.chip-act')
    if (active) active.scrollIntoView({ inline:'center', behavior:'smooth' })
  }, [activeTopic])

  return (
    <div
      ref={trackRef}
      style={{
        display:'flex', gap: isMobile ? '6px' : '8px',
        overflowX:'auto',
        padding: isMobile ? '3px 0 10px' : '4px 2px 12px',
        scrollbarWidth:'none',
        marginBottom: isMobile ? '14px' : '18px',
        WebkitOverflowScrolling:'touch',
      }}
    >
      <style>{`.chip-act-scroll::-webkit-scrollbar{display:none}`}</style>
      {topics.map(topic => {
        const isActive = activeTopic === topic._id
        return (
          <button
            key={topic._id}
            className={isActive ? 'chip-act' : ''}
            onClick={() => onSelect(topic._id)}
            style={{
              all:'unset', cursor:'pointer', flexShrink:0,
              display:'flex', alignItems:'center',
              gap: isMobile ? '5px' : '6px',
              padding: isMobile ? '7px 11px' : '7px 13px',
              borderRadius:'999px',
              border:`1.5px solid ${isActive ? tk.gold : tk.border}`,
              background: isActive
                ? 'linear-gradient(135deg,rgba(232,168,56,0.13),rgba(232,168,56,0.06))'
                : tk.card,
              boxShadow: isActive
                ? '0 2px 10px rgba(232,168,56,0.18)' : 'none',
              transition:'all 0.2s ease',
            }}
          >
            {topic.thumbnail ? (
              <img src={topic.thumbnail} alt="" style={{
                width: isMobile ? '17px' : '20px',
                height: isMobile ? '17px' : '20px',
                borderRadius:'50%', objectFit:'cover',
              }}/>
            ) : (
              <span style={{ fontSize: isMobile ? '12px' : '13px' }}>{getTopicIcon(topic.name)}</span>
            )}
            <span style={{
              fontSize: isMobile ? '11px' : '12px',
              fontWeight: isActive ? 700 : 600,
              whiteSpace:'nowrap',
              color: isActive ? tk.navy : tk.muted,
            }}>{topic.name}</span>
            {isActive && <span style={{ fontSize:'10px', color:tk.teal, fontWeight:700 }}>✓</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────
   TOPIC SIDEBAR — Card style matching home TopicCard
───────────────────────────────────────── */
function TopicSidebar({ topics, activeTopic, onSelect }) {
  const sidebarRef = useRef(null)

  useEffect(() => {
    if (!sidebarRef.current || !activeTopic) return
    const el = sidebarRef.current.querySelector('.sidebar-card-active')
    if (el) el.scrollIntoView({ block:'nearest', behavior:'smooth' })
  }, [activeTopic])

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      background:tk.card, border:`1.5px solid ${tk.border}`,
      borderRadius:'16px', overflow:'hidden', height:'100%',
    }}>
      {/* Header */}
      <div style={{
        padding:'14px 16px 12px',
        background:`linear-gradient(135deg,${tk.navy},${tk.navyLight})`,
        flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px' }}>
          <span style={{
            width:'6px', height:'6px', borderRadius:'50%',
            background:tk.gold, boxShadow:'0 0 7px rgba(232,168,56,0.5)',
          }}/>
          <span style={{
            fontSize:'9px', fontWeight:700, color:'rgba(232,168,56,0.9)',
            letterSpacing:'1.6px', textTransform:'uppercase',
          }}>Topic Library</span>
        </div>
        <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', marginTop:'2px' }}>
          {topics.length} topics · click to browse
        </p>
      </div>

      {/* Scrollable card list */}
      <div
        ref={sidebarRef}
        style={{
          flex:1, overflowY:'auto',
          padding:'12px',
          display:'flex', flexDirection:'column', gap:'10px',
          scrollbarWidth:'thin',
          scrollbarColor:`${tk.border} transparent`,
        }}
      >
        <style>{`
          .sidebar-topic-card {
            border-radius: 12px;
            overflow: hidden;
            background: #FFFFFF;
            border: 1.5px solid #E5E7EB;
            cursor: pointer;
            transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
            flex-shrink: 0;
          }
          .sidebar-topic-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.08);
            border-color: rgba(232,168,56,0.5);
          }
          .sidebar-topic-card.sidebar-card-active {
            border-color: #E8A838;
            box-shadow: 0 4px 16px rgba(232,168,56,0.18);
          }
          .sidebar-topic-thumb-img {
            transition: transform 0.35s ease;
            display: block;
          }
          .sidebar-topic-card:hover .sidebar-topic-thumb-img {
            transform: scale(1.05);
          }
        `}</style>

        {topics.map(topic => {
          const isActive = activeTopic === topic._id
          const icon = getTopicIcon(topic.name)
          const hasThumbnail = !!topic.thumbnail

          return (
            <div
              key={topic._id}
              className={`sidebar-topic-card${isActive ? ' sidebar-card-active' : ''}`}
              onClick={() => onSelect(topic._id)}
            >
              {/* Thumbnail — 16/9 */}
              <div style={{
                position:'relative',
                width:'100%',
                aspectRatio:'16/9',
                overflow:'hidden',
                background:'#F0EDE8',
              }}>
                {hasThumbnail ? (
                  <>
                    <img
                      src={topic.thumbnail}
                      alt={topic.name}
                      className="sidebar-topic-thumb-img"
                      style={{
                        width:'100%', height:'100%',
                        objectFit:'cover',
                      }}
                    />
                    {/* Bottom gradient */}
                    <div style={{
                      position:'absolute', bottom:0, left:0, right:0, height:'45%',
                      background:'linear-gradient(to top,rgba(0,0,0,0.3),transparent)',
                      pointerEvents:'none',
                    }}/>
                  </>
                ) : (
                  <div style={{
                    width:'100%', height:'100%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'32px',
                    background:'linear-gradient(135deg,#F5F3EF,#EDE8E0)',
                  }}>{icon}</div>
                )}

                {/* Video count badge — top right */}
                {/* <div style={{
                  position:'absolute', top:'7px', right:'7px',
                  fontSize:'9px', fontWeight:700,
                  color: hasThumbnail ? '#FFFFFF' : tk.muted,
                  background: hasThumbnail ? 'rgba(0,0,0,0.52)' : 'rgba(255,255,255,0.92)',
                  backdropFilter:'blur(4px)',
                  padding:'2px 8px', borderRadius:'999px',
                  border: hasThumbnail ? 'none' : `1px solid ${tk.border}`,
                }}>
                  {topic.videoCount || 0} Videos
                </div> */}

                {/* Active checkmark badge */}
                {isActive && (
                  <div style={{
                    position:'absolute', top:'7px', left:'7px',
                    width:'20px', height:'20px', borderRadius:'50%',
                    background:`linear-gradient(135deg,${tk.gold},${tk.goldDark})`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'10px', fontWeight:800, color:tk.navy,
                    boxShadow:'0 2px 8px rgba(232,168,56,0.4)',
                  }}>✓</div>
                )}

                {/* Icon overlay on bottom-left when thumbnail present */}
                {hasThumbnail && (
                  <div style={{
                    position:'absolute', bottom:'6px', left:'8px',
                    fontSize:'14px',
                    filter:'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
                  }}>{icon}</div>
                )}
              </div>

              {/* Info row */}
              <div style={{
                padding:'9px 11px 10px',
                display:'flex', flexDirection:'column', gap:'5px',
              }}>
                <h3 style={{
                  fontFamily:'Playfair Display,serif',
                  fontWeight:700,
                  fontSize:'12px',
                  color: isActive ? tk.navy : tk.text,
                  lineHeight:1.3,
                  textAlign:'center',
                  overflow:'hidden',
                  display:'-webkit-box',
                  WebkitLineClamp:2,
                  WebkitBoxOrient:'vertical',
                }}>{topic.name}</h3>

                <div style={{
                  paddingTop:'6px',
                  borderTop:`1px solid ${isActive ? 'rgba(232,168,56,0.2)' : tk.border}`,
                  textAlign:'center',
                }}>
                  <span style={{
                    fontSize:'10px', fontWeight:600,
                    color: isActive ? tk.gold : tk.faint,
                    display:'inline-flex', alignItems:'center', gap:'3px',
                    transition:'color 0.2s',
                  }}>
                    {isActive ? '▶ Viewing' : 'View Videos →'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Active Topic Banner ─── */
function ActiveTopicBanner({ topic, videoCount, isSubscribed, isMobile }) {
  if (!topic) return null
  const icon = getTopicIcon(topic.name)
  return (
    <div style={{
      position:'relative', borderRadius: isMobile ? '12px' : '16px',
      overflow:'hidden', marginBottom: isMobile ? '14px' : '20px',
      background:`linear-gradient(135deg,${tk.navy},${tk.navyLight})`,
    }}>
      {topic.thumbnail && (<>
        <img src={topic.thumbnail} alt={topic.name} style={{
          position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.08,
        }}/>
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${tk.navy}f2,${tk.navyLight}e8)` }}/>
      </>)}
      <div style={{
        position:'relative',
        padding: isMobile ? '12px 14px' : '16px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        gap: isMobile ? '8px' : '12px',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: isMobile ? '10px' : '12px', minWidth:0, flex:1 }}>
          <div style={{
            width: isMobile ? '34px' : '44px', height: isMobile ? '34px' : '44px',
            borderRadius: isMobile ? '9px' : '11px', flexShrink:0,
            background:'rgba(232,168,56,0.15)', border:'1px solid rgba(232,168,56,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize: isMobile ? '15px' : '20px',
          }}>{icon}</div>
          <div style={{ minWidth:0 }}>
            <p style={{
              fontSize:'9px', fontWeight:700, letterSpacing:'1.4px',
              color:'rgba(232,168,56,0.8)', textTransform:'uppercase', marginBottom:'2px',
            }}>Now Viewing</p>
            <h3 style={{
              fontFamily:'Playfair Display,serif', fontWeight:800,
              fontSize: isMobile ? '13px' : '17px',
              color:'#FFF', lineHeight:1.2,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{topic.name}</h3>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: isMobile ? '8px' : '12px', flexShrink:0 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{
              fontFamily:'Playfair Display,serif',
              fontSize: isMobile ? '16px' : '22px',
              fontWeight:800, color:tk.gold, lineHeight:1,
            }}>{videoCount}</div>
            <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', marginTop:'2px' }}>Videos</div>
          </div>
          {isSubscribed ? (
            <span style={{
              display:'inline-flex', alignItems:'center', gap:'4px',
              padding: isMobile ? '5px 9px' : '6px 13px',
              borderRadius:'9px',
              background:'rgba(42,157,143,0.18)', border:'1px solid rgba(42,157,143,0.32)',
              color:'#5DE8D8', fontSize: isMobile ? '10px' : '11px', fontWeight:700,
            }}>✓ Full Access</span>
          ) : (
            <Link href="/premium" style={{
              display:'inline-flex', alignItems:'center', gap:'5px',
              padding: isMobile ? '7px 11px' : '8px 16px', borderRadius:'9px',
              background:`linear-gradient(135deg,${tk.gold},${tk.goldDark})`,
              color:tk.navy, fontWeight:700,
              fontSize: isMobile ? '11px' : '12px',
              textDecoration:'none',
              boxShadow:'0 3px 12px rgba(232,168,56,0.32)',
              whiteSpace:'nowrap',
            }}>⭐ {isMobile ? 'Subscribe' : 'Subscribe to Play'}</Link>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Empty State ─── */
function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{
      textAlign:'center', padding:'clamp(36px,6vw,60px) 20px',
      borderRadius:'16px', background:tk.card, border:`1.5px solid ${tk.border}`,
    }}>
      <div style={{
        width:'64px', height:'64px', borderRadius:'16px',
        margin:'0 auto 14px',
        background:'rgba(27,42,74,0.04)', border:`1px solid ${tk.border}`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px',
      }}>{icon}</div>
      <p style={{ color:tk.text, fontWeight:700, fontSize:'14px', marginBottom:'5px' }}>{title}</p>
      <p style={{ color:tk.faint, fontSize:'12px', lineHeight:1.6 }}>{subtitle}</p>
    </div>
  )
}

/* ═══════════════════════════════════════════
   INNER PAGE CONTENT
═══════════════════════════════════════════ */
function ClassesPageInner() {
  const [freeVideos,    setFreeVideos]    = useState([])
  const [premiumVideos, setPremiumVideos] = useState([])
  const [topics,        setTopics]        = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [isSubscribed,  setIsSubscribed]  = useState(false)
  const [isLoggedIn,    setIsLoggedIn]    = useState(false)
  const [activeTopic,   setActiveTopic]   = useState('')
  const [loading,       setLoading]       = useState(true)
  const [premiumLoading,setPremiumLoading]= useState(false)
  const [playLimitHit,  setPlayLimitHit]  = useState(false)
  const [playCounts,    setPlayCounts]    = useState({})
  const [isMobile,      setIsMobile]      = useState(false)
  const [isTablet,      setIsTablet]      = useState(false)
  const [activeTab,     setActiveTab]     = useState('free')

  const router      = useRouter()
  const searchParams = useSearchParams()

  /* Responsive */
  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* Auth */
  useEffect(() => {
    const user = localStorage.getItem('ldce_user')
    setIsLoggedIn(!!user)
    if (user) {
      fetch('/api/user/profile').then(r => r.json()).then(data => {
        if (data.success && data.user?.subscription?.status === 'active') {
          if (new Date(data.user.subscription.endDate) > new Date()) {
            setIsSubscribed(true)
            localStorage.setItem('ldce_subscription', JSON.stringify(data.user.subscription))
          }
        }
      }).catch(() => {})
    }
  }, [])

  /* Initial load */
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [vRes, tRes] = await Promise.allSettled([
          fetch('/api/videos?type=free&limit=20'),
          fetch('/api/admin/topics'),
        ])
        if (vRes.status === 'fulfilled' && vRes.value.ok) {
          const d = await vRes.value.json()
          setFreeVideos(d.videos || [])
        }
        if (tRes.status === 'fulfilled' && tRes.value.ok) {
          const d = await tRes.value.json()
          const list = d.topics || []
          setTopics(list)
          const topicParam = searchParams?.get('topic')
          const initial = topicParam && list.find(tp => tp._id === topicParam)
            ? topicParam : list[0]?._id || ''
          setActiveTopic(initial)
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  /* URL topic param */
  useEffect(() => {
    const topicParam = searchParams?.get('topic')
    if (topicParam && topics.length > 0 && topics.find(tp => tp._id === topicParam)) {
      setActiveTopic(topicParam)
      setActiveTab('premium')
      setTimeout(() => {
        const el = document.getElementById('premium-section')
        if (el) el.scrollIntoView({ behavior:'smooth', block:'start' })
      }, 300)
    }
  }, [searchParams, topics])

  /* Fetch premium videos */
  const fetchPremiumVideos = useCallback(async (topicId) => {
    if (!topicId) return
    setPremiumLoading(true)
    try {
      const res  = await fetch(`/api/videos?type=premium&topicId=${topicId}&limit=50`)
      const data = await res.json()
      if (data.success) setPremiumVideos(data.videos || [])
    } catch {}
    setPremiumLoading(false)
  }, [])

  useEffect(() => {
    if (activeTopic) fetchPremiumVideos(activeTopic)
  }, [activeTopic, fetchPremiumVideos])

  function handleSubscribeClick() {
    toast('Subscribe to unlock video playback!', { icon:'⭐', duration:3000 })
    router.push('/premium')
  }

  async function handleVideoClick(video) {
    setPlayLimitHit(false)
    if (video.type === 'free') {
      try {
        const res  = await fetch('/api/videos/play', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ videoId: video._id || video.id }),
        })
        const data = await res.json()
        setSelectedVideo({ ...video, videoUrl: data.canPlay && data.streamUrl ? data.streamUrl : video.videoUrl })
      } catch { setSelectedVideo(video) }
      return
    }

    if (!isLoggedIn) {
      toast.error('Please login to access premium content', { icon:'🔐' })
      router.push('/auth/login?redirect=/classes'); return
    }
    if (!isSubscribed) { handleSubscribeClick(); return }

    try {
      const res  = await fetch('/api/videos/play', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ videoId: video._id || video.id }),
      })
      const data = await res.json()

      if (data.canPlay && data.streamUrl) {
        const usedCount   = data.playCount || 0
        const serverLimit = data.limit || video.playLimit || 3
        const remaining   = data.remaining ?? Math.max(0, serverLimit - usedCount)
        setPlayCounts(prev => ({ ...prev, [video._id]: usedCount }))
        localStorage.setItem(`ldce_plays_${video._id}`, String(usedCount))
        setSelectedVideo({ ...video, videoUrl: data.streamUrl, isLocked: false })
        if (remaining === 0) {
          toast('⚠️ Last play used — this video is now locked.', { duration:5000, style:{ background:'#FEF3C7', color:'#92400E', fontWeight:600 } })
        } else if (remaining === 1) {
          toast('⚠️ Only 1 play remaining!', { icon:'⚠️', duration:4000 })
        } else {
          toast.success(`${remaining} of ${serverLimit} plays remaining`, { duration:2500 })
        }
      } else if (data.reason === 'play_limit_exceeded') {
        const serverLimit = data.limit || video.playLimit || 3
        setPlayCounts(prev => ({ ...prev, [video._id]: serverLimit }))
        localStorage.setItem(`ldce_plays_${video._id}`, String(serverLimit))
        setPlayLimitHit(true)
        toast.error(`Play limit reached! All ${serverLimit} plays used.`, { duration:6000, style:{ background:'#FEE2E2', color:'#991B1B', fontWeight:600 } })
      } else if (data.reason === 'no_subscription') {
        setIsSubscribed(false); localStorage.removeItem('ldce_subscription')
        toast('Your subscription has expired.', { icon:'⭐', duration:5000 })
        router.push('/premium')
      } else {
        toast.error(data.error || 'Failed to play video.')
      }
    } catch (err) {
      console.error('Play error:', err); toast.error('Network error.')
    }
  }

  const activeTopicData = topics.find(tp => tp._id === activeTopic)
  const showSidebar     = !isMobile && !isTablet
  const showChips       = isMobile || isTablet
  const showTabs        = isMobile || isTablet

  const gridCols = isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)'
  const gridGap  = isMobile ? '12px' : isTablet ? '14px' : '20px'

  /* ── Premium video renderer (shared) ── */
  function renderPremiumGrid() {
    if (premiumLoading) return (
      <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:gridGap }}>
        {[1,2,3].map(i => <SkeletonCard key={i}/>)}
      </div>
    )
    if (premiumVideos.length === 0) return (
      <EmptyState
        icon="📹"
        title={`No videos yet for ${activeTopicData?.name || 'this topic'}`}
        subtitle="Videos are being added. Check back soon!"
      />
    )
    return (
      <>
        {isSubscribed && (
          <div style={{
            display:'flex', alignItems:'flex-start', gap:'10px',
            padding: isMobile ? '11px 13px' : '13px 17px',
            borderRadius:'12px',
            background:'rgba(232,168,56,0.04)',
            border:'1px solid rgba(232,168,56,0.12)',
            marginBottom: isMobile ? '14px' : '20px',
          }}>
            <span style={{ fontSize:'16px', flexShrink:0 }}>ℹ️</span>
            <p style={{ fontSize: isMobile ? '12px' : '13px', color:tk.muted, lineHeight:1.55 }}>
              <strong style={{ color:tk.text }}>Play limit: </strong>
              Each premium video can be watched up to{' '}
              <strong style={{ color:tk.gold }}>3 times</strong> per subscription period.
            </p>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:gridGap }}>
          {premiumVideos.map(video => {
            const videoId     = video._id || video.id
            const serverCount = playCounts[videoId] ?? null
            const limit       = video.playLimit || 3
            const usedCount   = serverCount !== null
              ? serverCount
              : (typeof window !== 'undefined'
                ? parseInt(localStorage.getItem(`ldce_plays_${videoId}`) || '0') : 0)

            // isExhausted only meaningful when subscribed — prevents overlay for non-subscribers
            const isExhausted = isSubscribed && usedCount >= limit

            return (
              <div key={videoId}>
                {/* Play count badge — only shown to subscribed users */}
                {isSubscribed && (
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'5px' }}>
                    <PlayCountBadge videoId={videoId} playLimit={limit} serverCount={serverCount}/>
                  </div>
                )}
                <div
                  style={{ position:'relative', borderRadius:'14px', overflow:'hidden' }}
                  onClick={() => {
                    if (!isSubscribed) { handleSubscribeClick(); return }
                    if (isExhausted) { toast.error('Play limit reached for this video.', { icon:'🔒' }); return }
                    handleVideoClick(video)
                  }}
                >
                  {/*
                    KEY FIX: pass isSubscribed into VideoCard so it gates the
                    isLimitReached check — prevents stale localStorage from
                    showing "Play limit reached" to non-subscribed users
                  */}
                  <VideoCard
                    video={{ ...video, isLocked: isExhausted }}
                    onClick={() => {}}
                    isSubscribed={isSubscribed}
                  />

                  {!isSubscribed && (
                    <div
                      style={{
                        position:'absolute', inset:0,
                        background:'rgba(0,0,0,0)',
                        borderRadius:'14px',
                        transition:'background 0.28s ease',
                        zIndex:3, cursor:'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.48)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                    >
                      <div style={{
                        position:'absolute', top:'10px', right:'10px',
                        padding:'3px 9px', borderRadius:'999px',
                        background:`linear-gradient(135deg,${tk.gold},${tk.goldDark})`,
                        fontSize:'9px', fontWeight:700, color:tk.navy, zIndex:4,
                      }}>⭐ PRO</div>

                      <div className="hover-play-lock" style={{
                        position:'absolute', inset:0,
                        display:'flex', flexDirection:'column',
                        alignItems:'center', justifyContent:'center',
                        gap:'8px', opacity:0,
                        transition:'opacity 0.25s ease',
                        pointerEvents:'none',
                      }}>
                        <div style={{
                          width:'46px', height:'46px', borderRadius:'50%',
                          background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)',
                          border:'2px solid rgba(232,168,56,0.5)',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px',
                        }}>🔒</div>
                        <span style={{
                          fontSize:'11px', fontWeight:700, color:'#fff',
                          background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)',
                          padding:'4px 11px', borderRadius:'999px',
                        }}>Subscribe to Play</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <style>{`
          div[style*="position:relative"]:hover .hover-play-lock { opacity: 1 !important; }
        `}</style>
      </>
    )
  }

  return (
    <>
      <style>{`
        @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeInUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        *,*::before,*::after  { box-sizing:border-box; margin:0; padding:0 }
        .cls-root             { min-height:100vh; background:${tk.bg}; }
        .cls-divider {
          height:1px;
          margin: ${isMobile ? '32px 0' : '48px 0'};
          background:linear-gradient(90deg,transparent,${tk.border} 30%,${tk.border} 70%,transparent);
        }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: ${tk.border}; border-radius: 4px; }
      `}</style>

      <div className="cls-root">
        <Navbar/>

        <div style={{
          maxWidth:'1800px', margin:'0 auto',
          padding: isMobile ? '74px 13px 56px' : isTablet ? '86px 18px 66px' : '96px 24px 80px',
        }}>

          {/* ── PAGE HEADER ── */}
          <header style={{
            textAlign:'center',
            marginBottom: isMobile ? '24px' : isTablet ? '32px' : 'clamp(32px,5vw,52px)',
            animation:'fadeInUp 0.55s ease both',
          }}>
            <div style={{ marginBottom:'10px' }}>
              <span style={{
                display:'inline-flex', alignItems:'center', gap:'6px',
                fontSize:'10px', fontWeight:700, color:tk.navy,
                background:'rgba(27,42,74,0.06)',
                border:'1px solid rgba(27,42,74,0.11)',
                padding:'5px 16px', borderRadius:'999px',
                textTransform:'uppercase', letterSpacing:'1.2px',
              }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:tk.gold, animation:'pulse 2s infinite' }}/>
                All Classes
              </span>
            </div>

            <h1 style={{
              fontFamily:'Playfair Display,serif', fontWeight:800,
              fontSize: isMobile ? 'clamp(22px,7vw,30px)' : 'clamp(28px,5vw,50px)',
              color:tk.text, lineHeight:1.14,
              marginBottom: isMobile ? '9px' : '13px',
              letterSpacing:'-1px',
            }}>
              Learn at Your{' '}
              <span style={{
                background:`linear-gradient(135deg,${tk.navy},${tk.navyLight})`,
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>Own Pace</span>
            </h1>

            <p style={{
              color:tk.muted,
              fontSize: isMobile ? '13px' : 'clamp(14px,2vw,16px)',
              lineHeight:1.7,
              maxWidth: isMobile ? '100%' : '500px',
              margin: isMobile ? '0 0 12px' : '0 auto 16px',
            }}>
              Start with free sample videos. Subscribe for full topic-wise video playback.
            </p>

            <div style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              gap:'7px', flexWrap:'wrap',
            }}>
              <span style={{
                display:'inline-flex', alignItems:'center', gap:'5px',
                padding:'5px 13px', borderRadius:'999px',
                background:'rgba(42,157,143,0.08)', border:'1px solid rgba(42,157,143,0.18)',
                fontSize: isMobile ? '11px' : '12px', fontWeight:600, color:tk.teal,
              }}>✓ Free videos — open to all</span>

              {isSubscribed ? (
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:'5px',
                  padding:'5px 13px', borderRadius:'999px',
                  background:'rgba(232,168,56,0.09)', border:'1px solid rgba(232,168,56,0.22)',
                  fontSize: isMobile ? '11px' : '12px', fontWeight:600, color:tk.gold,
                }}>⭐ Premium access active</span>
              ) : (
                <Link href="/premium" style={{
                  display:'inline-flex', alignItems:'center', gap:'5px',
                  padding:'5px 13px', borderRadius:'999px',
                  background:'rgba(27,42,74,0.06)', border:'1px solid rgba(27,42,74,0.14)',
                  fontSize: isMobile ? '11px' : '12px', fontWeight:600,
                  color:tk.navy, textDecoration:'none',
                }}>🔒 Subscribe to play premium</Link>
              )}
            </div>
          </header>

          {/* ════════════════════════════════════════
              MOBILE / TABLET — Tab layout
          ════════════════════════════════════════ */}
          {showTabs && (
            <div style={{ animation:'fadeInUp 0.55s ease 0.1s both' }}>
              <SectionTabs activeTab={activeTab} onTab={setActiveTab}/>

              {activeTab === 'free' && (
                <section>
                  <div style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    marginBottom:'14px', gap:'10px', flexWrap:'wrap',
                  }}>
                    <div>
                      <SectionLabel color={tk.teal} bg='rgba(42,157,143,0.09)' border='rgba(42,157,143,0.2)'>🎬 Free Samples</SectionLabel>
                      <h2 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize: isMobile ? '18px' : '22px', color:tk.text }}>Start Here — Free Videos</h2>
                    </div>
                    <span style={{ fontSize:'11px', color:tk.faint, background:tk.card, border:`1px solid ${tk.border}`, padding:'5px 12px', borderRadius:'999px' }}>
                      {loading ? '…' : `${freeVideos.length} video${freeVideos.length !== 1 ? 's' : ''}`}
                    </span>
                  </div>

                  {loading ? (
                    <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:gridGap }}>
                      {[1,2,3].map(i => <SkeletonCard key={i}/>)}
                    </div>
                  ) : freeVideos.length > 0 ? (
                    <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:gridGap }}>
                      {freeVideos.map(v => (
                        <VideoCard
                          key={v._id}
                          video={v}
                          onClick={() => handleVideoClick(v)}
                          isSubscribed={isSubscribed}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon="🎬" title="Free sample videos coming soon!" subtitle="Our team is preparing expert video lectures."/>
                  )}
                </section>
              )}

              {activeTab === 'premium' && (
                <section id="premium-section">
                  <div style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    marginBottom:'14px', gap:'10px', flexWrap:'wrap',
                  }}>
                    <div>
                      <SectionLabel color={tk.gold} bg='rgba(232,168,56,0.09)' border='rgba(232,168,56,0.22)'>⭐ Premium Content</SectionLabel>
                      <h2 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize: isMobile ? '18px' : '22px', color:tk.text, marginBottom:'3px' }}>Topic-Wise Full Courses</h2>
                      <p style={{ color:tk.faint, fontSize:'12px' }}>
                        {isSubscribed ? '✓ Full access — each video up to 3 plays' : 'Browse all topics — subscribe to play'}
                      </p>
                    </div>
                    {!premiumLoading && premiumVideos.length > 0 && (
                      <span style={{ fontSize:'11px', color:tk.faint, background:tk.card, border:`1px solid ${tk.border}`, padding:'5px 12px', borderRadius:'999px' }}>
                        {premiumVideos.length} video{premiumVideos.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {!isSubscribed && (
                    <div style={{
                      display:'flex', flexDirection:'column', gap:'12px',
                      padding:'14px 16px', borderRadius:'13px', marginBottom:'16px',
                      background:`linear-gradient(135deg,${tk.navy},${tk.navyLight})`,
                      border:'1px solid rgba(232,168,56,0.15)',
                    }}>
                      <div>
                        <p style={{ fontSize:'9px', fontWeight:700, color:'rgba(232,168,56,0.75)', letterSpacing:'1.4px', textTransform:'uppercase', marginBottom:'4px' }}>⭐ Subscription Required</p>
                        <h3 style={{ fontFamily:'Playfair Display,serif', fontSize: isMobile ? '14px' : '16px', fontWeight:800, color:'#FFF', marginBottom:'3px' }}>Subscribe to start watching</h3>
                        <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.38)' }}>200+ expert videos · 4-month access · 3 plays per video</p>
                      </div>
                      <Link href="/premium" style={{
                        display:'inline-flex', alignItems:'center', gap:'6px',
                        padding:'11px 18px', borderRadius:'10px',
                        background:`linear-gradient(135deg,${tk.gold},${tk.goldDark})`,
                        color:tk.navy, fontWeight:700, fontSize:'12px',
                        textDecoration:'none', alignSelf:'flex-start',
                        boxShadow:'0 4px 16px rgba(232,168,56,0.3)',
                      }}>⭐ Subscribe Now →</Link>
                    </div>
                  )}

                  {!loading && topics.length > 0 && (
                    <TopicChips topics={topics} activeTopic={activeTopic} onSelect={setActiveTopic} isMobile={isMobile}/>
                  )}

                  {loading ? (
                    <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:gridGap }}>
                      {[1,2,3].map(i => <SkeletonCard key={i}/>)}
                    </div>
                  ) : topics.length > 0 ? (
                    <>
                      {activeTopicData && (
                        <ActiveTopicBanner topic={activeTopicData} videoCount={premiumVideos.length} isSubscribed={isSubscribed} isMobile={isMobile}/>
                      )}
                      {renderPremiumGrid()}
                    </>
                  ) : (
                    <EmptyState icon="📚" title="Premium courses being prepared" subtitle="Our experts are crafting topic-wise content."/>
                  )}
                </section>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════
              DESKTOP — Two-section layout
          ════════════════════════════════════════ */}
          {!showTabs && (
            <>
              {/* ── FREE VIDEOS ── */}
              <section style={{ animation:'fadeInUp 0.55s ease 0.08s both' }}>
                <div style={{
                  display:'flex', alignItems:'flex-end', justifyContent:'space-between',
                  marginBottom:'20px', gap:'12px', flexWrap:'wrap',
                }}>
                  <div>
                    <SectionLabel color={tk.teal} bg='rgba(42,157,143,0.09)' border='rgba(42,157,143,0.18)'>🎬 Free Samples</SectionLabel>
                    <h2 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'clamp(20px,3vw,28px)', color:tk.text }}>Start Here — Free Videos</h2>
                  </div>
                  <span style={{ fontSize:'12px', color:tk.faint, background:tk.card, border:`1px solid ${tk.border}`, padding:'6px 14px', borderRadius:'999px' }}>
                    {loading ? '…' : `${freeVideos.length} video${freeVideos.length !== 1 ? 's' : ''}`}
                  </span>
                </div>

                {loading ? (
                  <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:gridGap }}>
                    {[1,2,3].map(i => <SkeletonCard key={i}/>)}
                  </div>
                ) : freeVideos.length > 0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:gridGap }}>
                    {freeVideos.map(v => (
                      <VideoCard
                        key={v._id}
                        video={v}
                        onClick={() => handleVideoClick(v)}
                        isSubscribed={isSubscribed}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="🎬" title="Free sample videos coming soon!" subtitle="Our team is preparing expert video lectures."/>
                )}
              </section>

              <div className="cls-divider"/>

              {/* ── PREMIUM SECTION ── */}
              <section id="premium-section" style={{ animation:'fadeInUp 0.55s ease 0.16s both' }}>
                <div style={{
                  display:'flex', alignItems:'flex-end', justifyContent:'space-between',
                  marginBottom:'22px', gap:'12px', flexWrap:'wrap',
                }}>
                  <div>
                    <SectionLabel color={tk.gold} bg='rgba(232,168,56,0.09)' border='rgba(232,168,56,0.2)'>⭐ Premium Content</SectionLabel>
                    <h2 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'clamp(20px,3vw,28px)', color:tk.text, marginBottom:'4px' }}>Topic-Wise Full Courses</h2>
                    <p style={{ color:tk.faint, fontSize:'13px' }}>
                      {isSubscribed ? '✓ Full access — each video can be watched up to 3 times' : 'Browse all topic videos below — subscribe to play them'}
                    </p>
                  </div>
                  {!premiumLoading && premiumVideos.length > 0 && (
                    <span style={{ fontSize:'12px', color:tk.faint, background:tk.card, border:`1px solid ${tk.border}`, padding:'6px 14px', borderRadius:'999px' }}>
                      {premiumVideos.length} video{premiumVideos.length !== 1 ? 's' : ''} in topic
                    </span>
                  )}
                </div>

                {/* Subscribe banner — desktop */}
                {!isSubscribed && (
                  <div style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    gap:'16px', padding:'20px 24px', borderRadius:'16px', marginBottom:'24px',
                    background:`linear-gradient(135deg,${tk.navy},${tk.navyLight})`,
                    border:'1px solid rgba(232,168,56,0.15)', flexWrap:'wrap',
                  }}>
                    <div>
                      <p style={{ fontSize:'10px', fontWeight:700, color:'rgba(232,168,56,0.75)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'4px' }}>⭐ Subscription Required to Play</p>
                      <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:'clamp(15px,2.5vw,19px)', fontWeight:800, color:'#FFF', marginBottom:'3px' }}>
                        You can browse all videos — subscribe to start watching
                      </h3>
                     
                    </div>
                    <Link href="/premium" style={{
                      display:'inline-flex', alignItems:'center', gap:'7px',
                      padding:'12px 24px', borderRadius:'12px',
                      background:`linear-gradient(135deg,${tk.gold},${tk.goldDark})`,
                      color:tk.navy, fontWeight:700, fontSize:'13px',
                      textDecoration:'none', whiteSpace:'nowrap',
                      boxShadow:'0 6px 20px rgba(232,168,56,0.32)',
                    }}>⭐ Subscribe Now →</Link>
                  </div>
                )}

                {/* Two-column: video grid + sidebar */}
                <div style={{
                  display:'grid',
                  gridTemplateColumns: showSidebar ? '1fr 260px' : '1fr',
                  gap: showSidebar ? '28px' : '0',
                  alignItems:'start',
                }}>
                  <div>
                    {loading ? (
                      <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:gridGap }}>
                        {[1,2,3].map(i => <SkeletonCard key={i}/>)}
                      </div>
                    ) : topics.length > 0 ? (
                      <>
                        {activeTopicData && (
                          <ActiveTopicBanner topic={activeTopicData} videoCount={premiumVideos.length} isSubscribed={isSubscribed} isMobile={false}/>
                        )}
                        {renderPremiumGrid()}
                      </>
                    ) : (
                      <EmptyState icon="📚" title="Premium courses are being prepared" subtitle="Our experts are crafting topic-wise content. Stay tuned!"/>
                    )}
                  </div>

                  {/* Desktop sidebar — card style */}
                  {showSidebar && (
                    <div style={{
                      position:'sticky', top:'104px',
                      maxHeight:'calc(100vh - 124px)',
                      display:'flex', flexDirection:'column',
                    }}>
                      {loading ? (
                        <div style={{
                          background:tk.card, border:`1.5px solid ${tk.border}`,
                          borderRadius:'16px', overflow:'hidden',
                        }}>
                          <div style={{
                            padding:'14px 16px 12px',
                            background:`linear-gradient(135deg,${tk.navy},${tk.navyLight})`,
                          }}>
                            <div style={{ height:'9px', width:'60%', borderRadius:'4px', background:'rgba(255,255,255,0.1)', marginBottom:'6px' }}/>
                            <div style={{ height:'8px', width:'40%', borderRadius:'4px', background:'rgba(255,255,255,0.06)' }}/>
                          </div>
                          <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'10px' }}>
                            {[1,2,3].map(i => <SkeletonSidebarCard key={i}/>)}
                          </div>
                        </div>
                      ) : topics.length > 0 ? (
                        <TopicSidebar
                          topics={topics}
                          activeTopic={activeTopic}
                          onSelect={setActiveTopic}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        {selectedVideo && (
          <VideoPlayerModal
            video={selectedVideo}
            onClose={() => { setSelectedVideo(null); setPlayLimitHit(false) }}
            onPlayLimitExceeded={() => setPlayLimitHit(true)}
          />
        )}
        <Footer/>
      </div>
    </>
  )
}

export default function ClassesPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight:'100vh', background:'#F5F3EF',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <div style={{ textAlign:'center' }}>
          <div style={{
            width:'38px', height:'38px', borderRadius:'50%', margin:'0 auto 12px',
            border:'3px solid rgba(27,42,74,0.1)', borderTopColor:'#E8A838',
            animation:'spin 1s linear infinite',
          }}/>
          <p style={{ color:'#6B7280', fontSize:'14px', fontWeight:500 }}>Loading classes...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    }>
      <ClassesPageInner/>
    </Suspense>
  )
}