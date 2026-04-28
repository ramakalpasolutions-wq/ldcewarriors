// src/components/layout/Navbar.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Pacifico } from 'next/font/google'
const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
})

const navLinks = [
  { href: '/',         label: 'Home',     icon: '🏠' },
  { href: '/classes',  label: 'Classes',  icon: '🎥' },
  { href: '/articles', label: 'Articles', icon: '📰' },
  { href: '/contact',  label: 'Contact',  icon: '📞' },
]

export default function Navbar() {
  const [scrolled,     setScrolled]     = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [user,         setUser]         = useState(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('ldce_user')
    if (stored) {
      setUser(JSON.parse(stored))
      const sub = localStorage.getItem('ldce_subscription')
      if (sub) {
        try {
          const parsed = JSON.parse(sub)
          if (parsed.status === 'active' && new Date(parsed.endDate) > new Date())
            setIsSubscribed(true)
        } catch { setIsSubscribed(false) }
      }
      fetch('/api/user/profile')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.user?.subscription?.status === 'active') {
            setIsSubscribed(true)
            localStorage.setItem('ldce_subscription', JSON.stringify(data.user.subscription))
          }
        }).catch(() => {})
    }
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('ldce_user')
      localStorage.removeItem('ldce_token')
      localStorage.removeItem('ldce_subscription')
      setUser(null); setIsSubscribed(false); setMenuOpen(false)
      router.push('/')
    } catch {}
  }

  return (
    <>
    
      <style>{`
      
        /* ── Reset ── */
        *,*::before,*::after { box-sizing: border-box; }

        /* ── Root ── */
        .nav-root {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          transition: all 0.3s ease;
        }
        .nav-inner {
          max-width: 1280px; margin: 0 auto;
          padding: 0 20px;
          display: flex; align-items: center;
          justify-content: space-between;
          height: 68px; gap: 12px;
        }

        /* ── Logo ── */
        .nav-logo-link {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .nav-logo-img {
          position: relative;
          width: 60px; height: 60px;
          border-radius: 10px; overflow: hidden;
          
          flex-shrink: 0;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .nav-logo-img:hover { transform: scale(1.15); }
.nav-logo-title {

  font-size: 24px;
  font-weight: normal; 
  color: #F2672A;
  letter-spacing: -0.3px;
  line-height: 1.1;
  white-space: nowrap;
}
        .nav-logo-sub {
          font-size: 9px; font-weight: 600;
          color: rgba(255,255,255,0.45);
          letter-spacing: 1.4px; text-transform: uppercase;
          margin-top: 1px;
        }

        /* ── Desktop links ── */
        .nav-links {
          display: flex; align-items: center; gap: 4px;
          flex: 1; justify-content: center;
        }
        .nav-link {
          padding: 8px 14px; border-radius: 10px;
          font-size: 13.5px; font-weight: 600;
          text-decoration: none; color: rgba(255,255,255,0.7);
          transition: all 0.2s; white-space: nowrap;
          border: 1px solid transparent;
        }
        .nav-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.08);
        }
        .nav-link.active {
          color: #E8A838;
          background: rgba(232,168,56,0.1);
          border-color: rgba(232,168,56,0.2);
        }

        /* ── Right actions ── */
        .nav-right {
          display: flex; align-items: center; gap: 8px; flex-shrink: 0;
        }
        .nav-premium-btn {
          background: linear-gradient(135deg,#E8A838,#D4922A);
          color: #1B2A4A; padding: 8px 16px; border-radius: 10px;
          font-size: 12px; font-weight: 700; text-decoration: none;
          white-space: nowrap; display: inline-flex; align-items: center; gap: 5px;
          transition: opacity 0.2s;
        }
        .nav-premium-btn:hover { opacity: 0.9; }
        .nav-sub-badge {
          background: rgba(42,157,143,0.1);
          border: 1px solid rgba(42,157,143,0.3);
          color: #4DD9CB; padding: 6px 12px; border-radius: 10px;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; gap: 5px; white-space: nowrap;
        }
        .nav-user-chip {
          display: flex; align-items: center; gap: 7px;
          padding: 4px 10px 4px 5px; border-radius: 30px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff; text-decoration: none; font-size: 12px;
          transition: background 0.2s;
        }
        .nav-user-chip:hover { background: rgba(255,255,255,0.1); }
        .nav-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          background: linear-gradient(135deg,#E8A838,#D4922A);
          color: #1B2A4A;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; flex-shrink: 0;
        }
        .nav-logout-btn {
          background: none; border: none;
          color: rgba(252,165,165,0.8); font-size: 11px;
          font-weight: 600; cursor: pointer; padding: 6px 8px;
          border-radius: 8px; transition: color 0.2s, background 0.2s;
        }
        .nav-logout-btn:hover {
          color: #FCA5A5;
          background: rgba(252,165,165,0.08);
        }

        /* ── Hamburger ── */
        .nav-ham {
          display: none;
          width: 42px; height: 42px; border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          flex-direction: column; justify-content: center;
          align-items: center; gap: 5px; cursor: pointer;
          flex-shrink: 0; transition: background 0.2s;
        }
        .nav-ham:hover { background: rgba(255,255,255,0.1); }
        .nav-ham span {
          width: 18px; height: 2px;
          background: #E8A838;
          border-radius: 2px; transition: 0.3s;
          display: block;
        }

        /* ── Mobile overlay ── */
        .nav-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          z-index: 1050; display: none; cursor: pointer;
        }
        .nav-overlay.open { display: block; }

        /* ── Mobile drawer ── */
        .nav-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(300px, 85vw);
          background: linear-gradient(160deg,#1B2A4A,#152038);
          z-index: 1100;
          transform: translateX(100%);
          transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
          display: flex; flex-direction: column;
          border-left: 1px solid rgba(232,168,56,0.15);
          overflow-y: auto;
        }
        .nav-drawer.open { transform: translateX(0); }
        .nav-drawer-head {
          display: flex; justify-content: space-between;
          align-items: center; padding: 18px 18px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .nav-drawer-close {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff; width: 36px; height: 36px;
          border-radius: 8px; font-size: 20px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; line-height: 1;
        }
        .nav-drawer-links {
          display: flex; flex-direction: column;
          padding: 12px 12px; gap: 4px; flex: 1;
        }
        .nav-drawer-link {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 12px;
          font-size: 15px; font-weight: 600;
          text-decoration: none; color: rgba(255,255,255,0.75);
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .nav-drawer-link:hover,
        .nav-drawer-link.active {
          color: #E8A838;
          background: rgba(232,168,56,0.08);
          border-color: rgba(232,168,56,0.15);
        }
        .nav-drawer-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .nav-drawer-footer {
          padding: 14px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column; gap: 8px;
          flex-shrink: 0;
        }
        .nav-drawer-premium {
          display: flex; align-items: center; justify-content: center;
          gap: 7px; padding: 12px;
          background: linear-gradient(135deg,#E8A838,#D4922A);
          color: #1B2A4A; font-size: 13px; font-weight: 700;
          border-radius: 12px; text-decoration: none;
        }
        .nav-drawer-signin {
          display: flex; align-items: center; justify-content: center;
          gap: 7px; padding: 11px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff; font-size: 13px; font-weight: 600;
          border-radius: 12px; text-decoration: none;
        }
        .nav-drawer-logout {
          background: rgba(252,165,165,0.08);
          border: 1px solid rgba(252,165,165,0.15);
          color: #FCA5A5; font-size: 13px; font-weight: 600;
          padding: 11px; border-radius: 12px;
          cursor: pointer; width: 100%;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .nav-links { display: none; }
          .nav-ham   { display: flex; }
        }
        @media (max-width: 768px) {
          .nav-right { display: none; }
          .nav-inner { height: 60px; padding: 0 16px; }
          .nav-logo-title { font-size: 15px; }
        }
        @media (max-width: 400px) {
          .nav-inner { height: 60px; padding: 0 16px;}
          .nav-logo-title { display: none; }
          .nav-logo-sub   { display: none; }
        }
      `}</style>

      <nav
        className="nav-root"
        style={{
          background: scrolled ? 'rgba(18,28,46,0.98)' : '#1B2A4A',
          borderBottom: scrolled
            ? '1px solid rgba(232,168,56,0.18)'
            : '1px solid rgba(255,255,255,0.05)',
          boxShadow: scrolled ? '0 6px 24px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <div className="nav-inner">

          {/* ── LOGO ── */}
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-img">
              <Image src="/image.png" alt="LDCE Logo" fill style={{ objectFit:'contain' }} priority />
            </div>
            <div>
              <div className={`nav-logo-title ${pacifico.className}`}>
  LDCE Warriors
</div>
            </div>
          </Link>

          {/* ── DESKTOP LINKS ── */}
          <div className="nav-links">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── DESKTOP RIGHT ── */}
          <div className="nav-right">
            {isSubscribed ? (
              <div className="nav-sub-badge">
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#2A9D8F', flexShrink:0 }}/>
                Subscribed
              </div>
            ) : (
              <Link href="/premium" className="nav-premium-btn">⭐ Premium</Link>
            )}

            {user ? (
              <>
                <Link href="/profile" className="nav-user-chip">
                  <div className="nav-avatar">{user.fullName?.[0]}</div>
                  <span>{user.fullName?.split(' ')[0]}</span>
                </Link>
                <button className="nav-logout-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <Link href="/auth/login" className="nav-link">Sign In</Link>
            )}
          </div>

          {/* ── HAMBURGER ── */}
          <button className="nav-ham" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <span/><span/><span/>
          </button>
        </div>
      </nav>

      {/* ── MOBILE OVERLAY ── */}
      <div className={`nav-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}/>

      {/* ── MOBILE DRAWER ── */}
      <div className={`nav-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="nav-drawer-head">
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ position:'relative', width:'34px', height:'34px', borderRadius:'8px', overflow:'hidden', border:'1px solid rgba(232,168,56,0.4)', background:'#000' }}>
              <Image src="/image.png" alt="Logo" fill style={{ objectFit:'contain' }}/>
            </div>
            <div>
              <div className={` ${pacifico.className}`} style={{ fontSize:'13px', fontWeight:800, color:'#F2672A' }}>LDCE Warriors</div>
              <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.4)', letterSpacing:'1px', textTransform:'uppercase' }}>Exam Prep</div>
            </div>
          </div>
          <button className="nav-drawer-close" onClick={() => setMenuOpen(false)}>×</button>
        </div>

        <div className="nav-drawer-links">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-drawer-link ${pathname === link.href ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <div className="nav-drawer-icon">{link.icon}</div>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Drawer footer */}
        <div className="nav-drawer-footer">
          {user ? (
            <>
              <div style={{
                display:'flex', alignItems:'center', gap:'10px',
                padding:'10px 12px', borderRadius:'12px',
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
              }}>
                <div className="nav-avatar" style={{ width:'32px', height:'32px', fontSize:'13px' }}>
                  {user.fullName?.[0]}
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{user.fullName}</div>
                  <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)' }}>
                    {isSubscribed ? '⭐ Premium Member' : 'Free Account'}
                  </div>
                </div>
              </div>
              {!isSubscribed && (
                <Link href="/premium" className="nav-drawer-premium" onClick={() => setMenuOpen(false)}>
                  ⭐ Get Premium Access
                </Link>
              )}
              <button className="nav-drawer-logout" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="nav-drawer-signin" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
              <Link href="/premium" className="nav-drawer-premium" onClick={() => setMenuOpen(false)}>
                ⭐ Get Premium
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}