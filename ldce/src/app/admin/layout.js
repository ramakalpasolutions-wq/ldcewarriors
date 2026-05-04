// src/app/admin/layout.js
'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'

const tk = {
  navy: '#1B2A4A',
  navyLight: '#243656',
  navyDark: '#12203A',
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

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard',    icon: '📊', desc: 'Overview & stats'      },
  { href: '/admin/videos',    label: 'Videos',        icon: '🎥', desc: 'Manage video content'  },
  { href: '/admin/articles',  label: 'Articles',      icon: '📰', desc: 'Blog & study material' },
  { href: '/admin/hero',      label: 'Hero Carousel', icon: '🎞️', desc: 'Homepage banners'      },
  { href: '/admin/topics',    label: 'Topics',        icon: '🏷️', desc: 'Course categories'     },
  { href: '/admin/coupons',   label: 'Coupons',       icon: '🎟️', desc: 'Discount codes'        },
  { href: '/admin/users',     label: 'Users',         icon: '👥', desc: 'User management'       },
]

export default function AdminLayout({ children }) {
  const [collapsed,      setCollapsed]      = useState(false)
  const [authChecked,    setAuthChecked]    = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hoverItem,      setHoverItem]      = useState(null)
  const [currentTime,    setCurrentTime]    = useState('')
  const [screenSize,     setScreenSize]     = useState('desktop')
  const pathname = usePathname()
  const router   = useRouter()

  const isLoginPage = pathname === '/admin'

  /* ── Screen size detection ── */
  useEffect(() => {
    function check() {
      const w = window.innerWidth
      if (w < 640)        setScreenSize('mobile')
      else if (w < 1024)  setScreenSize('tablet')
      else                setScreenSize('desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isMobile  = screenSize === 'mobile'
  const isTablet  = screenSize === 'tablet'
  const isDesktop = screenSize === 'desktop'

  /* ── Auto-collapse sidebar on tablet ── */
  useEffect(() => {
    if (isTablet)  setCollapsed(true)
    if (isDesktop) setCollapsed(false)
  }, [isTablet, isDesktop])

  /* ── Auth check ── */
  useEffect(() => {
    if (isLoginPage) return
    const admin = localStorage.getItem('ldce_admin')
    if (!admin) { router.push('/admin'); return }
    setAuthChecked(true)
  }, [router, isLoginPage])

  /* ── Close mobile menu on route change ── */
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  /* ── Clock ── */
  useEffect(() => {
    function tick() {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
      }))
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  /* ── Lock body scroll on mobile menu open ── */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  if (isLoginPage) return children

  async function handleLogout() {
    try { await fetch('/api/admin/logout', { method: 'POST' }) } catch {}
    localStorage.removeItem('ldce_admin')
    router.push('/admin')
  }

  /* ── Loading screen ── */
  if (!authChecked) {
    return (
      <>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
          @keyframes dotPulse {
            0%,80%,100% { transform: scale(0) }
            40%          { transform: scale(1) }
          }
        `}</style>
        <div style={{
          minHeight: '100vh', background: tk.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '20px',
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: `linear-gradient(135deg,${tk.navy},${tk.navyLight})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(27,42,74,0.3)',
            }}>
              <svg style={{
                width: '24px', height: '24px',
                animation: 'spin 1s linear infinite', color: tk.gold,
              }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity:.25 }} cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: tk.text, fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                Verifying access
              </p>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%', background: tk.gold,
                    animation: `dotPulse 1.4s ${i * 0.16}s infinite ease-in-out both`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const currentPage = NAV_ITEMS.find(n => pathname.startsWith(n.href))

  /* ══════════════════════════════════════
     SIDEBAR CONTENT
  ══════════════════════════════════════ */
  function SidebarContent({ isMobileDrawer = false }) {
    const isCollapsed = collapsed && !isMobileDrawer

    return (
      <>
        {/* ── Logo Header ── */}
        <div style={{
          padding: isCollapsed ? '14px 10px' : '14px 16px',
          borderBottom: '1px solid rgba(232,168,56,0.08)',
          display: 'flex', alignItems: 'center', gap: '10px',
          height: isMobileDrawer ? '64px' : isTablet ? '60px' : '68px',
          flexShrink: 0, position: 'relative', zIndex: 1,
        }}>
          {/* Logo */}
          <div style={{
            width: '38px', height: '38px', borderRadius: '11px',
            overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            border: '2px solid rgba(232,168,56,0.22)',
          }}>
            <Image
              src="/image.png" alt="Logo"
              width={38} height={38}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Brand text */}
          {!isCollapsed && (
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{
                color: '#FFFFFF', fontWeight: 800, fontSize: '14px',
                lineHeight: 1.1, fontFamily: 'Playfair Display,serif',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>LDCE Admin</div>
              <div style={{
                color: tk.gold, fontSize: '8px', marginTop: '3px',
                fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
              }}>Control Panel</div>
            </div>
          )}

          {/* Action button */}
          {isMobileDrawer ? (
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)', fontSize: '15px',
                cursor: 'pointer', padding: '5px 9px', borderRadius: '8px',
                transition: 'all 0.2s', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >✕</button>
          ) : (
            <button
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Expand' : 'Collapse'}
              style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.3)', fontSize: '13px',
                cursor: 'pointer',
                padding: isCollapsed ? '5px 7px' : '5px 9px',
                borderRadius: '8px', transition: 'all 0.25s',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}
            >{collapsed ? '›' : '‹'}</button>
          )}
        </div>

        {/* ── Section label ── */}
        {!isCollapsed && (
          <div style={{
            padding: '12px 18px 4px',
            fontSize: '8px', fontWeight: 700,
            color: 'rgba(255,255,255,0.18)',
            letterSpacing: '2px', textTransform: 'uppercase',
            position: 'relative', zIndex: 1,
          }}>Navigation</div>
        )}

        {/* ── Nav Links ── */}
        <nav style={{
          flex: 1,
          padding: '4px 6px',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '1px',
          scrollbarWidth: 'none',
          position: 'relative', zIndex: 1,
        }}>
          {NAV_ITEMS.map(item => {
            const isActive  = pathname.startsWith(item.href)
            const isHovered = hoverItem === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobileDrawer ? () => setMobileMenuOpen(false) : undefined}
                title={isCollapsed ? item.label : ''}
                onMouseEnter={() => setHoverItem(item.href)}
                onMouseLeave={() => setHoverItem(null)}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: '10px',
                  padding: isCollapsed ? '11px 0' : '9px 12px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: '11px', fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: 'none',
                  transition: 'all 0.18s ease',
                  border: '1px solid transparent',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  position: 'relative',
                  color: isActive
                    ? tk.gold
                    : isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.38)',
                  background: isActive
                    ? 'rgba(232,168,56,0.11)'
                    : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderColor: isActive ? 'rgba(232,168,56,0.16)' : 'transparent',
                }}
              >
                {/* Active bar */}
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '8px', bottom: '8px',
                    width: '3px', borderRadius: '0 3px 3px 0', background: tk.gold,
                  }} />
                )}

                {/* Icon */}
                <span style={{
                  fontSize: '16px', flexShrink: 0,
                  width: '20px', textAlign: 'center',
                  transition: 'transform 0.25s cubic-bezier(.34,1.56,.64,1)',
                  transform: (isHovered || isActive) ? 'scale(1.15)' : 'scale(1)',
                }}>{item.icon}</span>

                {/* Label + desc */}
                {!isCollapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'block', fontSize: isMobileDrawer ? '14px' : '13px',
                    }}>{item.label}</span>
                    {(isHovered || isActive) && (
                      <span style={{
                        fontSize: '10px', display: 'block', marginTop: '1px',
                        color: isActive
                          ? 'rgba(232,168,56,0.5)' : 'rgba(255,255,255,0.2)',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{item.desc}</span>
                    )}
                  </div>
                )}

                {/* Active dot when collapsed */}
                {isActive && isCollapsed && (
                  <div style={{
                    position: 'absolute', right: '5px', top: '50%',
                    transform: 'translateY(-50%)',
                    width: '4px', height: '4px', borderRadius: '50%',
                    background: tk.gold, boxShadow: `0 0 6px ${tk.gold}60`,
                  }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Footer ── */}
        <div style={{
          padding: '8px 6px 12px',
          borderTop: '1px solid rgba(232,168,56,0.08)',
          flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: '1px',
          position: 'relative', zIndex: 1,
        }}>
          {/* Status pill */}
          {!isCollapsed && (
            <div style={{
              padding: '7px 12px', marginBottom: '2px',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%', background: tk.teal,
                boxShadow: `0 0 7px ${tk.teal}80`, animation: 'pulse 2.5s infinite',
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: '9px', color: 'rgba(255,255,255,0.22)',
                fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.4px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>Production · Online</span>
            </div>
          )}

          {/* View Site */}
          <Link
            href="/" target="_blank"
            onClick={isMobileDrawer ? () => setMobileMenuOpen(false) : undefined}
            title={isCollapsed ? 'View Site' : ''}
            className="al-footer-link"
            style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: isCollapsed ? '9px 0' : '8px 12px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              borderRadius: '10px', fontSize: '12px', fontWeight: 500,
              textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden',
              color: 'rgba(255,255,255,0.32)', transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '14px', flexShrink: 0, width: '20px', textAlign: 'center' }}>🌐</span>
            {!isCollapsed && 'View Site'}
          </Link>

          {/* Logout */}
          <button
            onClick={() => { handleLogout(); if (isMobileDrawer) setMobileMenuOpen(false) }}
            title={isCollapsed ? 'Logout' : ''}
            className="al-footer-link al-logout-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: isCollapsed ? '9px 0' : '8px 12px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              borderRadius: '10px', fontSize: '12px', fontWeight: 500,
              border: 'none', background: 'none', cursor: 'pointer',
              width: '100%', fontFamily: 'DM Sans,sans-serif',
              whiteSpace: 'nowrap', overflow: 'hidden',
              color: 'rgba(255,255,255,0.32)', transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '14px', flexShrink: 0, width: '20px', textAlign: 'center' }}>🚪</span>
            {!isCollapsed && 'Logout'}
          </button>
        </div>
      </>
    )
  }

  /* ── Sidebar width calculation ── */
  const sidebarWidth = collapsed ? '64px' : '252px'

  return (
    <>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideInLeft {
          from { transform: translateX(-100%) }
          to   { transform: translateX(0) }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0 }
          100% { background-position:  200% 0 }
        }

        *, *::before, *::after { box-sizing: border-box; }

        /* ── Shell ── */
        .al-wrap {
          min-height: 100vh;
          background: ${tk.bg};
          display: flex;
        }

        /* ── Sidebar ── */
        .al-sidebar {
          background: linear-gradient(180deg,${tk.navy} 0%,${tk.navyDark} 100%);
          border-right: 1px solid rgba(232,168,56,0.08);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 30;
          box-shadow: 2px 0 20px rgba(0,0,0,0.12);
          overflow: hidden;
          transition: width 0.28s cubic-bezier(.4,0,.2,1),
                      min-width 0.28s cubic-bezier(.4,0,.2,1);
        }
        .al-sidebar::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg,transparent,${tk.gold},transparent);
          z-index: 2;
        }
        .al-sidebar::after {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(232,168,56,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,168,56,0.015) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none; z-index: 0;
        }
        .al-sidebar nav::-webkit-scrollbar { display: none; }

        /* ── Footer link hover ── */
        .al-footer-link:hover {
          color: ${tk.gold} !important;
          background: rgba(232,168,56,0.06) !important;
        }
        .al-logout-btn:hover {
          color: #FCA5A5 !important;
          background: rgba(239,68,68,0.08) !important;
        }

        /* ── Main area ── */
        .al-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* ── Top header ── */
        .al-header {
          border-bottom: 1px solid ${tk.border};
          background: rgba(255,255,255,0.93);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 1px 8px rgba(0,0,0,0.04);
        }

        /* ── Content ── */
        .al-content {
          flex: 1;
          overflow: auto;
          animation: fadeIn 0.3s ease;
        }

        /* ── Hamburger ── */
        .al-hamburger {
          background: rgba(27,42,74,0.05);
          border: 1px solid rgba(27,42,74,0.1);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: '4px';
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .al-hamburger:hover {
          background: rgba(27,42,74,0.09);
          border-color: rgba(27,42,74,0.18);
        }
        .al-hamburger:active { transform: scale(0.95); }
        .al-hamburger-bar {
          display: block;
          background: ${tk.navy};
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        /* ── Breadcrumb ── */
        .al-breadcrumb {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; color: ${tk.faint};
          min-width: 0; overflow: hidden;
        }
        .al-breadcrumb a {
          color: ${tk.faint}; text-decoration: none; transition: color 0.2s;
          white-space: nowrap;
        }
        .al-breadcrumb a:hover { color: ${tk.gold}; }
        .al-breadcrumb-sep { font-size: '10px'; color: ${tk.border}; flex-shrink: 0; }
        .al-breadcrumb-current {
          color: ${tk.navy}; font-weight: 700;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* ── Overlay ── */
        .al-overlay {
          position: fixed; inset: 0;
          background: rgba(10,15,28,0.55);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          z-index: 40;
          animation: fadeIn 0.22s ease;
        }

        /* ── Mobile Drawer ── */
        .al-drawer {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          background: linear-gradient(180deg,${tk.navy} 0%,${tk.navyDark} 100%);
          border-right: 1px solid rgba(232,168,56,0.12);
          z-index: 50;
          display: flex;
          flex-direction: column;
          box-shadow: 8px 0 36px rgba(0,0,0,0.22);
          transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }
        .al-drawer::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg,transparent,${tk.gold},transparent);
          z-index: 2;
        }
        .al-drawer::after {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(232,168,56,0.015) 1px,transparent 1px),
            linear-gradient(90deg,rgba(232,168,56,0.015) 1px,transparent 1px);
          background-size: 36px 36px;
          pointer-events: none; z-index: 0;
        }
        .al-drawer nav::-webkit-scrollbar { display: none; }

        /* ══════════════════════════════
           GLOBAL ADMIN COMPONENT STYLES
        ══════════════════════════════ */
        .adm-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
          position: relative;
        }
        .adm-table-wrap {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }
        .adm-table { width: 100%; border-collapse: collapse; }
        .adm-table th {
          padding: 12px 16px; text-align: left;
          font-size: 10px; font-weight: 800;
          color: ${tk.navy}; text-transform: uppercase;
          letter-spacing: 0.9px;
          background: rgba(27,42,74,0.04);
          border-bottom: 1px solid #E5E7EB;
          white-space: nowrap;
        }
        .adm-table td {
          padding: 12px 16px; font-size: 13px;
          color: ${tk.text}; border-bottom: 1px solid #F3F4F6;
          vertical-align: middle;
        }
        .adm-table tr:last-child td { border-bottom: none; }
        .adm-table tr { transition: background 0.15s ease; }
        .adm-table tr:hover td { background: rgba(245,243,239,0.6); }

        .adm-input {
          width: 100%; padding: 10px 13px;
          border-radius: 11px; background: #FAFAF8;
          border: 1px solid #E5E7EB; color: ${tk.text};
          font-size: 13px; outline: none;
          font-family: 'DM Sans',sans-serif;
          transition: border .2s ease, box-shadow .2s ease, background .2s ease;
        }
        .adm-input:focus {
          border-color: ${tk.gold};
          box-shadow: 0 0 0 3px rgba(232,168,56,0.1);
          background: #FFFFFF;
        }
        .adm-input::placeholder { color: #9CA3AF; }
        .adm-input:disabled { opacity: 0.5; cursor: not-allowed; }

        .adm-btn-primary {
          padding: 10px 20px; border-radius: 11px;
          background: linear-gradient(135deg,${tk.navy},${tk.navyLight});
          color: #fff; font-size: 13px; font-weight: 700;
          border: none; cursor: pointer;
          font-family: 'DM Sans',sans-serif;
          transition: all 0.22s ease;
          box-shadow: 0 4px 14px rgba(27,42,74,0.22);
          display: inline-flex; align-items: center; gap: 6px;
          white-space: nowrap;
        }
        .adm-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(27,42,74,0.32);
        }
        .adm-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .adm-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .adm-btn-secondary {
          padding: 10px 16px; border-radius: 11px;
          background: rgba(255,255,255,0.85);
          border: 1px solid #E5E7EB; color: #6B7280;
          font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans',sans-serif;
          transition: all 0.2s ease; white-space: nowrap;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .adm-btn-secondary:hover:not(:disabled) {
          color: ${tk.navy}; border-color: rgba(27,42,74,0.2);
          background: #FFFFFF; transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.06);
        }
        .adm-btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }

        .adm-badge {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 3px 9px; border-radius: 999px;
          font-size: 11px; font-weight: 700; white-space: nowrap;
        }
        .adm-badge-green  { background:rgba(34,197,94,.1);  color:#16a34a; border:1px solid rgba(34,197,94,.2);  }
        .adm-badge-red    { background:rgba(239,68,68,.1);  color:#dc2626; border:1px solid rgba(239,68,68,.2);  }
        .adm-badge-yellow { background:rgba(234,179,8,.1);  color:#ca8a04; border:1px solid rgba(234,179,8,.2);  }
        .adm-badge-blue   { background:rgba(59,130,246,.1); color:#2563eb; border:1px solid rgba(59,130,246,.2); }
        .adm-badge-gray   { background:rgba(107,114,128,.1);color:#6B7280; border:1px solid rgba(107,114,128,.2);}
        .adm-badge-cta    { background:rgba(232,168,56,.1); color:#D4922A; border:1px solid rgba(232,168,56,.2); }

        .adm-spinner {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 52px 24px;
        }
        .adm-empty { text-align: center; padding: 60px 24px; }

        /* ── Responsive layout ── */
        @media (min-width: 1025px) {
          .al-sidebar {
            display: flex !important;
            width: ${sidebarWidth};
            min-width: ${sidebarWidth};
          }
          .al-hamburger { display: none !important; }
          .al-header {
            height: 64px;
            padding: 0 28px;
          }
          .al-content { padding: 28px; }
          .adm-card { padding: 22px; border-radius: 18px; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .al-sidebar {
            display: flex !important;
            width: ${collapsed ? '64px' : '220px'};
            min-width: ${collapsed ? '64px' : '220px'};
          }
          .al-hamburger { display: none !important; }
          .al-header {
            height: 60px;
            padding: 0 20px;
          }
          .al-content { padding: 20px; }
          .adm-card { padding: 18px; border-radius: 16px; }
        }
        @media (max-width: 640px) {
          .al-sidebar { display: none !important; }
          .al-hamburger { display: flex !important; }
          .al-header { height: 56px; padding: 0 14px; }
          .al-content { padding: 14px; }
          .adm-card { padding: 14px; border-radius: 14px; }
          .adm-table th,
          .adm-table td { padding: 10px 12px; }
          .adm-btn-primary,
          .adm-btn-secondary { padding: 9px 14px; font-size: 12px; }
        }
      `}</style>

      <div className="al-wrap">

        {/* ══ Desktop / Tablet Sidebar ══ */}
        <aside className="al-sidebar">
          <SidebarContent />
        </aside>

        {/* ══ Main ══ */}
        <main className="al-main">

          {/* ── Header ── */}
          <header className="al-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>

              {/* Hamburger — mobile only */}
              <button
                className="al-hamburger"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                style={{
                  width: isMobile ? '40px' : '38px',
                  height: isMobile ? '40px' : '38px',
                  padding: '0',
                  gap: '0',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                  <span className="al-hamburger-bar" style={{ width: '17px', height: '2px' }} />
                  <span className="al-hamburger-bar" style={{ width: '13px', height: '2px' }} />
                  <span className="al-hamburger-bar" style={{ width: '17px', height: '2px' }} />
                </div>
              </button>

              {/* Breadcrumb */}
              <div className="al-breadcrumb" style={{ minWidth: 0, flex: 1 }}>
                <Link href="/admin/dashboard" style={{ flexShrink: 0 }}>Admin</Link>
                {currentPage && (
                  <>
                    <span className="al-breadcrumb-sep" style={{ flexShrink: 0 }}>›</span>
                    <span className="al-breadcrumb-current">
                      {currentPage.icon} {isMobile ? currentPage.label : `${currentPage.label}`}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Header right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', flexShrink: 0 }}>

              {/* Clock — tablet + desktop only */}
              {!isMobile && currentTime && (
                <span style={{
                  color: tk.muted,
                  background: 'rgba(27,42,74,0.04)',
                  border: `1px solid ${tk.border}`,
                  fontFamily: 'JetBrains Mono,monospace',
                  fontSize: '11px',
                  padding: '5px 11px', borderRadius: '999px',
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  whiteSpace: 'nowrap',
                }}>
                  🕐 {currentTime}
                </span>
              )}

              {/* Live indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: isMobile ? '5px 9px' : '5px 12px',
                borderRadius: '999px',
                background: 'rgba(42,157,143,0.06)',
                border: '1px solid rgba(42,157,143,0.15)',
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%', background: tk.teal,
                  boxShadow: `0 0 7px ${tk.teal}60`, animation: 'pulse 2.5s infinite',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: '11px', color: tk.teal, fontWeight: 600,
                  fontFamily: 'JetBrains Mono,monospace', whiteSpace: 'nowrap',
                }}>
                  {isMobile ? '' : 'Live'}
                </span>
              </div>

              {/* Mobile logout shortcut */}
              {isMobile && (
                <button
                  onClick={handleLogout}
                  title="Logout"
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '9px',
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    color: '#ef4444', fontSize: '15px',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >🚪</button>
              )}
            </div>
          </header>

          {/* ── Page Content ── */}
          <div className="al-content">
            {children}
          </div>
        </main>

        {/* ══ Mobile Overlay ══ */}
        {mobileMenuOpen && (
          <div
            className="al-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ══ Mobile Drawer ══ */}
        <div
          className="al-drawer"
          style={{
            width: isMobile ? '280px' : '300px',
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <SidebarContent isMobileDrawer />
        </div>
      </div>
    </>
  )
}