'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Pacifico } from 'next/font/google'
import toast from 'react-hot-toast'

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
})

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Track scroll position for glassmorphic transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 🌟 Live sync with server to instantly catch Admin "Add Family" updates
  useEffect(() => {
    // 1. Initial fast load from localStorage
    try {
      const storedUser = localStorage.getItem('ldce_user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (e) {
      console.error(e)
    }

    // 2. Fresh background fetch from server profile API
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user)
          localStorage.setItem('ldce_user', JSON.stringify(data.user))
        }
      })
      .catch(() => {})
  }, [pathname])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error(e)
    }
    localStorage.removeItem('ldce_user')
    localStorage.removeItem('ldce_token')
    localStorage.removeItem('ldce_admin')
    setUser(null)
    toast.success('Logged out successfully')
    router.push('/auth/login')
  }

  const NAV_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/classes', label: 'Classes' },
    { href: '/articles', label: 'Articles' },
    { href: '/contact', label: 'Contact' },
  ]

  // Check if current user is active in Join Family
  const isFamilyMember = Boolean(
    user?.isPremium &&
    (!user?.premiumExpiresAt || new Date(user?.premiumExpiresAt) > new Date())
  )

  const isJoinFamilyActive = pathname === '/join-family'

  return (
    <>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 14px rgba(232, 168, 56, 0.35), 0 4px 15px rgba(0, 0, 0, 0.2);
          }
          50% {
            box-shadow: 0 0 24px rgba(232, 168, 56, 0.65), 0 6px 20px rgba(232, 168, 56, 0.3);
          }
        }
        @keyframes activeGlow {
          0%, 100% {
            box-shadow: 0 0 12px rgba(42, 157, 143, 0.35);
          }
          50% {
            box-shadow: 0 0 20px rgba(42, 157, 143, 0.65);
          }
        }
        @keyframes sparkleRotate {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(15deg); }
        }

        /* ── Join Family Button (When NOT yet active) ── */
        .nav-join-family-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 18px;
          border-radius: 999px;
          background: linear-gradient(135deg, #F0C060 0%, #E8A838 50%, #D4922A 100%);
          background-size: 200% 100%;
          color: #12203A !important;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: pulseGlow 3s infinite;
          border: 1.5px solid rgba(255, 255, 255, 0.45);
          overflow: hidden;
        }
        .nav-join-family-btn:hover {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 0 30px rgba(232, 168, 56, 0.8), 0 8px 24px rgba(0,0,0,0.25) !important;
        }

        /* ── Active Family Member Badge (When ACTIVATED) ── */
        .nav-family-active-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 999px;
          background: rgba(42, 157, 143, 0.15);
          border: 1.5px solid rgba(42, 157, 143, 0.4);
          color: #5DE8D8 !important;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s ease;
          animation: activeGlow 3s infinite;
        }
        .nav-family-active-badge:hover {
          background: rgba(42, 157, 143, 0.25);
          border-color: #5DE8D8;
          transform: translateY(-1px);
        }

        .nav-join-family-sparkle {
          display: inline-block;
          animation: sparkleRotate 2.4s ease-in-out infinite;
          font-size: 15px;
          line-height: 1;
        }

        .nav-link-standard {
          position: relative;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.78);
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .nav-link-standard:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.06);
        }
        .nav-link-standard.active {
          color: #E8A838;
          background: rgba(232, 168, 56, 0.08);
        }
      `}</style>

      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 900,
          background: isScrolled
            ? 'rgba(13, 24, 41, 0.94)'
            : 'linear-gradient(180deg, rgba(13, 24, 41, 0.9) 0%, rgba(13, 24, 41, 0.7) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: isScrolled
            ? '1px solid rgba(232, 168, 56, 0.15)'
            : '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'all 0.35s ease',
          boxShadow: isScrolled ? '0 10px 30px rgba(0, 0, 0, 0.35)' : 'none',
        }}
      >
        <div
          style={{
            maxWidth: '1580px',
            margin: '0 auto',
            padding: '0 24px',
            height: '72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* ── Brand Logo ── */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                overflow: 'hidden',
                flexShrink: 0,
                border: '1.5px solid rgba(232, 168, 56, 0.3)',
                boxShadow: '0 4px 12px rgba(232, 168, 56, 0.15)',
              }}
            >
              <Image
                src="/image.png"
                alt="LDCE Logo"
                width={42}
                height={42}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                priority
              />
            </div>
            <div>
              <span
                className={pacifico.className}
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#F2672A',
                  display: 'block',
                  lineHeight: 1,
                  letterSpacing: '0.2px',
                }}
              >
                LDCE Warriors
              </span>
              <span
                style={{
                  fontSize: '8.5px',
                  fontWeight: 700,
                  color: '#E8A838',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginTop: '3px',
                  display: 'block',
                }}
              >
                Learn • Practice • Succeed
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation Links ── */}
          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '8px',
            }}
            className="md-flex-nav"
          >
            <style>{`
              @media (min-width: 769px) {
                .md-flex-nav { display: flex !important; }
                .mobile-toggle-btn { display: none !important; }
              }
            `}</style>

            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link-standard ${isActive ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              )
            })}

            {/* 🌟 Dynamic Join Family Button / Active Status Badge 🌟 */}
            {isFamilyMember ? (
              <Link
                href="/classes"
                className="nav-family-active-badge"
                style={{ marginLeft: '8px', marginRight: '6px' }}
                title="Your family membership is active! Click to view classes."
              >
                <span>✓</span>
                <span>Family Active</span>
              </Link>
            ) : (
              <Link
                href="/join-family"
                className="nav-join-family-btn"
                style={{
                  marginLeft: '8px',
                  marginRight: '6px',
                  transform: isJoinFamilyActive ? 'scale(1.05)' : 'none',
                }}
              >
                <span className="nav-join-family-sparkle">⭐</span>
                <span>Join Family</span>
              </Link>
            )}

            {/* ── Auth / User Profile ── */}
            {user ? (
              <div style={{ position: 'relative', marginLeft: '6px' }}>
                <button
                  onClick={() => setDropdownOpen((p) => !p)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '999px',
                    padding: '5px 12px 5px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1B2A4A, #243656)',
                      border: isFamilyMember ? '1.5px solid #2A9D8F' : '1px solid #E8A838',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isFamilyMember ? '#5DE8D8' : '#E8A838',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {user.fullName?.charAt(0) || 'U'}
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      maxWidth: '110px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.fullName?.split(' ')[0]}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      width: '210px',
                      background: '#152036',
                      border: '1px solid rgba(232, 168, 56, 0.2)',
                      borderRadius: '14px',
                      padding: '8px',
                      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
                      zIndex: 1000,
                    }}
                  >
                    {/* Membership Status in dropdown */}
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '6px' }}>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: isFamilyMember ? '#5DE8D8' : '#E8A838', marginTop: '2px' }}>
                        {isFamilyMember ? '⭐ Family Member' : 'Free Tier'}
                      </p>
                    </div>

                    {user.role === 'admin' && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          color: '#E8A838',
                          fontSize: '13px',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        👑 Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      👤 My Profile
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        handleLogout()
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.25s',
                  marginLeft: '4px',
                }}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* ── Mobile Menu Toggle Button ── */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen((p) => !p)}
            aria-label="Toggle mobile menu"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Mobile Dropdown Menu Drawer ── */}
        {mobileMenuOpen && (
          <div
            style={{
              background: '#0D1829',
              borderBottom: '1px solid rgba(232, 168, 56, 0.2)',
              padding: '16px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {/* Dynamic Join Family Banner for Mobile */}
            {isFamilyMember ? (
              <Link
                href="/classes"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  margin: '8px 0 14px',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'rgba(42, 157, 143, 0.15)',
                  border: '1.5px solid #2A9D8F',
                  color: '#5DE8D8',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                }}
              >
                <span>✓ Family Membership Active</span>
                <span style={{ fontSize: '12px' }}>Classes →</span>
              </Link>
            ) : (
              <Link
                href="/join-family"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  margin: '8px 0 14px',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #E8A838 0%, #D4922A 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: '#12203A',
                  fontWeight: 800,
                  fontSize: '14.5px',
                  boxShadow: '0 8px 24px rgba(232, 168, 56, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⭐</span>
                  <span>Join Family</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800 }}>Explore →</span>
              </Link>
            )}

            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    color: isActive ? '#E8A838' : 'rgba(255, 255, 255, 0.85)',
                    background: isActive ? 'rgba(232, 168, 56, 0.08)' : 'transparent',
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: 'none',
                    fontSize: '15px',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}

            <div
              style={{
                height: '1px',
                background: 'rgba(255, 255, 255, 0.08)',
                margin: '10px 0',
              }}
            />

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      color: '#E8A838',
                      fontWeight: 700,
                      textDecoration: 'none',
                      fontSize: '15px',
                    }}
                  >
                    👑 Admin Dashboard
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontWeight: 500,
                    textDecoration: 'none',
                    fontSize: '15px',
                  }}
                >
                  👤 My Profile ({user.fullName})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#EF4444',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginTop: '4px',
                  }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textAlign: 'center',
                  padding: '13px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14.5px',
                  textDecoration: 'none',
                  marginTop: '6px',
                }}
              >
                Sign In / Register
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  )
}