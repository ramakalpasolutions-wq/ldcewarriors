// src/app/admin/dashboard/page.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import adminFetch from '@/lib/adminFetch'

const STAT_CARDS = [
  { label: 'Total Users',          icon: '👥', key: 'users',         href: '/admin/users',    accent: '#3b82f6' },
  { label: 'Active Subscriptions', icon: '⭐', key: 'subscriptions', href: '/admin/users',    accent: '#E8A838' },
  { label: 'Total Videos',         icon: '🎥', key: 'videos',        href: '/admin/videos',   accent: '#8b5cf6' },
  { label: 'Total Articles',       icon: '📰', key: 'articles',      href: '/admin/articles', accent: '#2A9D8F' },
]

const QUICK_ACTIONS = [
  { label: 'Upload Video',   icon: '🎬', href: '/admin/videos',   desc: 'Add free or premium video'  },
  { label: 'Write Article',  icon: '✍️', href: '/admin/articles', desc: 'Create new article'          },
  { label: 'Add Hero Slide', icon: '🖼️', href: '/admin/hero',     desc: 'Update homepage carousel'   },
  { label: 'Create Coupon',  icon: '🎟️', href: '/admin/coupons',  desc: 'Generate discount code'     },
  { label: 'Add Topic',      icon: '🏷️', href: '/admin/topics',   desc: 'Organize course content'    },
  { label: 'Manage Users',   icon: '👤', href: '/admin/users',    desc: 'View and manage users'      },
]

export default function AdminDashboard() {
  const [stats,       setStats]       = useState({ users: 0, subscriptions: 0, videos: 0, articles: 0 })
  const [recentUsers, setRecentUsers] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [screenSize,  setScreenSize]  = useState('desktop')

  useEffect(() => {
    function check() {
      const w = window.innerWidth
      if (w < 640)       setScreenSize('mobile')
      else if (w < 1024) setScreenSize('tablet')
      else               setScreenSize('desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isMobile  = screenSize === 'mobile'
  const isTablet  = screenSize === 'tablet'
  const isDesktop = screenSize === 'desktop'

  async function fetchStats() {
    setLoading(true)
    try {
      const res  = await adminFetch('/api/admin/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        setRecentUsers(data.recentUsers || [])
      } else toast.error('Failed to load dashboard stats')
    } catch { toast.error('Failed to connect to server') }
    setLoading(false)
  }

  useEffect(() => { fetchStats() }, [])

  /* ── Skeleton block ── */
  function Skel({ w = 52, h = 30 }) {
    return (
      <div style={{
        width: w, height: h, borderRadius: '6px',
        background: 'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
      }} />
    )
  }

  /* ── Stat card ── */
  function StatCard({ card, idx }) {
    const [hov, setHov] = useState(false)
    return (
      <Link
        href={card.href}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: '#FFFFFF',
          border: `1.5px solid ${hov ? `${card.accent}30` : '#F0F1F3'}`,
          borderRadius: isMobile ? '16px' : '20px',
          padding: isMobile ? '14px 12px' : isTablet ? '18px 16px' : '22px 20px',
          textDecoration: 'none', display: 'block',
          transition: 'transform 0.28s cubic-bezier(.34,1.56,.64,1), box-shadow 0.28s ease, border-color 0.28s ease',
          boxShadow: hov ? '0 14px 36px rgba(0,0,0,0.09)' : '0 2px 10px rgba(0,0,0,0.04)',
          transform: hov ? 'translateY(-4px)' : 'translateY(0)',
          position: 'relative', overflow: 'hidden',
          animationDelay: `${idx * 60}ms`,
        }}
      >
        {/* Accent top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: card.accent, borderRadius: '20px 20px 0 0',
          opacity: hov ? 1 : 0, transition: 'opacity 0.25s',
        }} />

        {/* Icon */}
        <div style={{
          width: isMobile ? '38px' : '46px',
          height: isMobile ? '38px' : '46px',
          borderRadius: '12px',
          background: `${card.accent}16`,
          border: `1.5px solid ${card.accent}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isMobile ? '18px' : '22px',
          marginBottom: isMobile ? '10px' : '14px',
          transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1)',
          transform: hov ? 'scale(1.12) rotate(-6deg)' : 'scale(1)',
        }}>{card.icon}</div>

        {/* Number */}
        <div style={{
          fontFamily: 'Playfair Display,serif', fontWeight: 800,
          fontSize: isMobile ? '22px' : isTablet ? '26px' : '30px',
          color: card.accent, lineHeight: 1, marginBottom: '4px',
        }}>
          {loading
            ? <Skel w={isMobile ? 40 : 52} h={isMobile ? 22 : 28} />
            : (stats[card.key] ?? 0).toLocaleString()}
        </div>

        {/* Label */}
        <div style={{
          fontSize: isMobile ? '11px' : '12px',
          color: '#6B7280', fontWeight: 600,
          letterSpacing: '0.2px',
          lineHeight: 1.3,
        }}>{card.label}</div>
      </Link>
    )
  }

  /* ── Action card ── */
  function ActionCard({ action }) {
    const [hov, setHov] = useState(false)
    return (
      <Link
        href={action.href}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: '#FFFFFF',
          border: `1.5px solid ${hov ? 'rgba(232,168,56,0.3)' : '#F0F1F3'}`,
          borderRadius: '14px',
          padding: isMobile ? '12px 14px' : '14px 16px',
          display: 'flex', alignItems: 'center',
          gap: isMobile ? '10px' : '12px',
          textDecoration: 'none',
          transition: 'all 0.25s cubic-bezier(.34,1.56,.64,1)',
          boxShadow: hov ? '0 8px 24px rgba(0,0,0,0.07)' : '0 2px 8px rgba(0,0,0,0.03)',
          transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: isMobile ? '40px' : '46px',
          height: isMobile ? '40px' : '46px',
          background: hov ? 'rgba(232,168,56,0.12)' : 'rgba(27,42,74,0.05)',
          border: `1.5px solid ${hov ? 'rgba(232,168,56,0.25)' : 'rgba(27,42,74,0.08)'}`,
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isMobile ? '18px' : '20px', flexShrink: 0,
          transition: 'all 0.25s cubic-bezier(.34,1.56,.64,1)',
          transform: hov ? 'scale(1.08) rotate(-4deg)' : 'scale(1)',
        }}>{action.icon}</div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#1A1D23', fontWeight: 600,
            fontSize: isMobile ? '12px' : '13px',
            marginBottom: '2px',
          }}>{action.label}</div>
          {!isMobile && (
            <div style={{ color: '#9CA3AF', fontSize: '11px' }}>{action.desc}</div>
          )}
        </div>

        {/* Arrow */}
        <svg style={{
          width: '13px', height: '13px', flexShrink: 0,
          color: hov ? '#E8A838' : '#D1D5DB',
          transition: 'transform 0.2s, color 0.2s',
          transform: hov ? 'translateX(3px)' : 'translateX(0)',
        }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    )
  }

  /* ── Stats grid columns ── */
  const statsColumns = isMobile
    ? 'repeat(2, 1fr)'
    : isTablet
      ? 'repeat(2, 1fr)'
      : 'repeat(4, 1fr)'

  /* ── Actions grid columns ── */
  const actionsColumns = isMobile
    ? 'repeat(2, 1fr)'
    : isTablet
      ? 'repeat(2, 1fr)'
      : 'repeat(3, 1fr)'

  /* ── System grid columns ── */
  const sysColumns = isMobile
    ? '1fr'
    : isTablet
      ? 'repeat(2, 1fr)'  
      : 'repeat(3, 1fr)'

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

        .dash-page {
          display: flex; flex-direction: column;
          animation: fadeInUp 0.4s ease both;
        }

        /* ── Section header ── */
        .dash-sec-hd {
          display: flex; align-items: center;
          gap: 8px;
        }
        .dash-sec-pill {
          width: 4px; height: 18px; border-radius: 2px; flex-shrink: 0;
        }
        .dash-sec-title {
          font-weight: 700; color: #1A1D23; margin: 0;
        }

        /* ── User row ── */
        .dash-user-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 11px;
          background: rgba(27,42,74,0.03);
          border: 1.5px solid #F3F4F6;
          transition: background 0.2s, border-color 0.2s;
        }
        .dash-user-row:hover {
          background: rgba(232,168,56,0.05);
          border-color: rgba(232,168,56,0.18);
        }
        .dash-user-avatar {
          border-radius: 50%;
          background: linear-gradient(135deg,#1B2A4A,#243656);
          display: flex; align-items: center; justify-content: center;
          color: #E8A838; font-weight: 700; flex-shrink: 0;
        }

        /* ── Sys item ── */
        .dash-sys-item {
          background: rgba(27,42,74,0.03);
          border: 1.5px solid #ECEDF0;
          border-radius: 12px;
          display: flex; align-items: center; gap: 11px;
          transition: border-color 0.2s, background 0.2s;
        }
        .dash-sys-item:hover {
          background: rgba(27,42,74,0.05);
          border-color: rgba(27,42,74,0.12);
        }

        /* ── View-all link ── */
        .dash-view-all {
          font-size: 12px; color: #E8A838; font-weight: 600;
          text-decoration: none; display: flex; align-items: center; gap: 3px;
          transition: gap 0.2s; flex-shrink: 0;
        }
        .dash-view-all:hover { gap: 6px; }
      `}</style>

      <div className="dash-page" style={{ gap: isMobile ? '18px' : '24px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'Playfair Display,serif', fontWeight: 800,
              fontSize: isMobile ? '20px' : 'clamp(20px,3vw,26px)',
              color: '#1A1D23', marginBottom: '3px',
            }}>
              {isMobile ? 'Dashboard' : 'Admin Dashboard'}
            </h1>
            <p style={{ color: '#6B7280', fontSize: '13px' }}>
              {isMobile
                ? "Here's your overview."
                : "Welcome back! Here's an overview of your platform."}
            </p>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="adm-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
          >
            <span style={{
              display: 'inline-block',
              animation: loading ? 'spin 1s linear infinite' : 'none',
            }}>
              {loading ? '⏳' : '🔄'}
            </span>
            {!isMobile && 'Refresh'}
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: statsColumns,
          gap: isMobile ? '10px' : '14px',
        }}>
          {STAT_CARDS.map((card, i) => (
            <StatCard key={card.key} card={card} idx={i} />
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <div className="dash-sec-hd" style={{ marginBottom: isMobile ? '12px' : '14px' }}>
            <div className="dash-sec-pill" style={{ background: '#E8A838' }} />
            <h2 className="dash-sec-title" style={{ fontSize: isMobile ? '13px' : '15px' }}>
              Quick Actions
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: actionsColumns,
            gap: isMobile ? '8px' : '12px',
          }}>
            {QUICK_ACTIONS.map(action => (
              <ActionCard key={action.label} action={action} />
            ))}
          </div>
        </div>

        {/* ── Recent Users ── */}
        {(recentUsers.length > 0 || loading) && (
          <div className="adm-card" style={{ padding: isMobile ? '14px' : '20px' }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isMobile ? '12px' : '16px',
              gap: '8px',
            }}>
              <div className="dash-sec-hd">
                <div className="dash-sec-pill" style={{ background: '#1B2A4A' }} />
                <h2 className="dash-sec-title" style={{ fontSize: isMobile ? '13px' : '15px' }}>
                  {isMobile ? 'Recent Users' : 'Recent Registrations'}
                </h2>
              </div>
              <Link href="/admin/users" className="dash-view-all">
                View All →
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    height: '52px', borderRadius: '11px',
                    background: 'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
                  }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {recentUsers.map(user => (
                  <div key={user._id} className="dash-user-row">
                    {/* Avatar */}
                    <div
                      className="dash-user-avatar"
                      style={{
                        width: isMobile ? '32px' : '36px',
                        height: isMobile ? '32px' : '36px',
                        fontSize: isMobile ? '12px' : '14px',
                      }}
                    >
                      {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        color: '#1A1D23', fontSize: isMobile ? '12px' : '13px',
                        fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginBottom: '1px',
                      }}>
                        {user.fullName}
                      </p>
                      {!isMobile && (
                        <p style={{
                          color: '#9CA3AF', fontSize: '11px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {user.email}
                        </p>
                      )}
                      {isMobile && (
                        <p style={{
                          color: '#9CA3AF', fontSize: '10px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {user.email}
                        </p>
                      )}
                    </div>

                    {/* Date badge */}
                    <span style={{
                      color: '#9CA3AF',
                      fontSize: isMobile ? '10px' : '11px',
                      whiteSpace: 'nowrap', flexShrink: 0,
                      background: 'rgba(27,42,74,0.05)',
                      padding: isMobile ? '2px 6px' : '3px 8px',
                      borderRadius: '6px', fontWeight: 500,
                    }}>
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short',
                        ...(isDesktop ? { year: 'numeric' } : {}),
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── System Overview ── */}
        <div className="adm-card" style={{ padding: isMobile ? '14px' : '20px' }}>
          <div className="dash-sec-hd" style={{ marginBottom: isMobile ? '12px' : '16px' }}>
            <div className="dash-sec-pill" style={{ background: '#2A9D8F' }} />
            <h2 className="dash-sec-title" style={{ fontSize: isMobile ? '13px' : '15px' }}>
              System Overview
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: sysColumns,
            gap: isMobile ? '8px' : '12px',
          }}>
            {[
              { label: 'Subscription Months',  value: '4 months',   icon: '📰' },
              { label: 'Play Limit (Premium)', value: '3 plays per video',  icon: '▶️' },
              { label: 'Device Limit',         value: '1 device per user',  icon: '📱' },
            ].map(item => (
              <div
                key={item.label}
                className="dash-sys-item"
                style={{ padding: isMobile ? '12px' : '14px 16px' }}
              >
                <span style={{ fontSize: isMobile ? '20px' : '22px', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    color: '#9CA3AF', fontSize: '10px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.7px',
                    marginBottom: '3px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    color: '#1A1D23', fontWeight: 700,
                    fontSize: isMobile ? '12px' : '13px',
                  }}>
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}