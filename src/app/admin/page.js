// src/app/admin/page.js
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import AdminAnimatedBackground from '@/components/ui/AdminAnimatedBackground'
import AdminLoadingScreen from '@/components/ui/AdminLoadingScreen'

export default function AdminLoginPage() {
  const [form,           setForm]         = useState({ email: '', password: '' })
  const [loading,        setLoading]      = useState(false)
  const [focusedField,   setFocusedField] = useState(null)
  const [showPass,       setShowPass]     = useState(false)
  const [showContent,    setShowContent]  = useState(false)
  const [mounted,        setMounted]      = useState(false)
  const [screenSize,     setScreenSize]   = useState('desktop')
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  /* ── Screen size ── */
  useEffect(() => {
    function check() {
      const w = window.innerWidth
      if (w < 480)       setScreenSize('xs')
      else if (w < 768)  setScreenSize('mobile')
      else if (w < 1024) setScreenSize('tablet')
      else               setScreenSize('desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isXs      = screenSize === 'xs'
  const isMobile  = screenSize === 'mobile' || screenSize === 'xs'
  const isTablet  = screenSize === 'tablet'
  const isDesktop = screenSize === 'desktop'

  function inputStyle(field) {
    const focused = focusedField === field
    return {
      width: '100%',
      padding: isMobile ? '12px 14px' : '14px 16px',
      borderRadius: '12px',
      background: focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
      border: focused
        ? '1.5px solid rgba(232,168,56,0.5)'
        : '1px solid rgba(255,255,255,0.08)',
      color: '#FFFFFF',
      fontSize: isMobile ? '15px' : '14px', // Larger on mobile to prevent zoom
      outline: 'none',
      fontFamily: 'DM Sans,sans-serif',
      transition: 'all 0.25s ease',
      boxShadow: focused
        ? '0 0 0 3px rgba(232,168,56,0.08),0 0 18px rgba(232,168,56,0.05)'
        : 'none',
      letterSpacing: field === 'password' && !showPass && form.password ? '3px' : '0',
      WebkitAppearance: 'none',
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Email and password required'); return
    }
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('ldce_admin', JSON.stringify(data.user))
        toast.success('Welcome, Admin!')
        router.push('/admin/dashboard')
      } else {
        toast.error(data.error || 'Invalid admin credentials')
      }
    } catch {
      toast.error('Login failed. Please try again.')
    }
    setLoading(false)
  }

  if (!mounted) return null

  /* ── Responsive values ── */
  const cardPadding    = isXs ? '22px 16px' : isMobile ? '28px 22px' : isTablet ? '32px 28px' : '36px 32px'
  const logoSize       = isXs ? 60 : isMobile ? 64 : 72
  const titleSize      = isXs ? '22px' : isMobile ? '24px' : '28px'
  const maxCardWidth   = isXs ? '100%' : isMobile ? '400px' : '440px'
  const rootPadding    = isXs ? '16px 12px' : isMobile ? '32px 16px' : isTablet ? '40px 24px' : '48px 20px'

  return (
    <>
      <style>{`
        @keyframes adminFadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes adminLogoFloat {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-5px) rotate(-1deg); }
        }
        @keyframes adminShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes adminGlowPulse {
          0%,100% { box-shadow: 0 0 18px rgba(232,168,56,0.12); }
          50%      { box-shadow: 0 0 36px rgba(232,168,56,0.22); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes tealPulse {
          0%,100% { opacity:1; } 50% { opacity:0.5; }
        }

        *, *::before, *::after { box-sizing: border-box; }

        .adl-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: linear-gradient(160deg,#0D1829 0%,#152036 40%,#1B2A4A 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        input::placeholder { color: rgba(255,255,255,0.25) !important; }

        /* Prevent iOS zoom on input focus */
        @media (max-width: 768px) {
          input[type="email"],
          input[type="password"],
          input[type="text"] {
            font-size: 16px !important;
          }
        }

        /* ── Login card ── */
        .adl-card-wrap {
          position: relative;
          z-index: 10;
          width: 100%;
          animation: adminFadeInUp 0.7s ease both;
        }

        .adl-logo-wrap {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .adl-security-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          background: rgba(232,168,56,0.06);
          border: 1px solid rgba(232,168,56,0.15);
        }

        .adl-submit-btn {
          width: 100%;
          border-radius: 13px;
          background: linear-gradient(135deg,#E8A838 0%,#D4922A 100%);
          color: #1B2A4A;
          font-weight: 800;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans',sans-serif;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: '0.3px';
        }
        .adl-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(232,168,56,0.32);
        }
        .adl-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .adl-submit-btn:disabled {
          background: rgba(232,168,56,0.3);
          cursor: not-allowed;
          box-shadow: none;
          opacity: 0.7;
        }

        .adl-back-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: rgba(232,168,56,0.4);
          font-size: 12px;
          text-decoration: none;
          transition: color 0.2s;
          font-weight: 600;
        }
        .adl-back-link:hover { color: #E8A838; }

        /* ── Field label ── */
        .adl-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }

        /* ── Show pass button ── */
        .adl-show-pass {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 6px;
          color: rgba(255,255,255,0.28);
          transition: color 0.2s;
          display: flex;
          align-items: center;
          line-height: 1;
        }
        .adl-show-pass:hover { color: #E8A838; }

        /* Security badges row */
        .adl-sec-row {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
        }
      `}</style>

      {/* Loading screen */}
      {!showContent && (
        <AdminLoadingScreen onFinished={() => setShowContent(true)} />
      )}

      <div
        className="adl-root"
        style={{
          padding: rootPadding,
          opacity: showContent ? 1 : 0,
          transition: 'opacity 0.6s ease 0.2s',
        }}
      >
        {/* Animated canvas background */}
        <AdminAnimatedBackground />

        {/* Ambient overlays */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'radial-gradient(ellipse at 30% 20%,rgba(27,42,74,0.3) 0%,transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'radial-gradient(ellipse at 70% 80%,rgba(232,168,56,0.04) 0%,transparent 60%)',
        }} />

        {/* ── Card wrapper ── */}
        <div
          className="adl-card-wrap"
          style={{
            maxWidth: maxCardWidth,
            animation: showContent ? 'adminFadeInUp 0.7s ease both' : 'none',
          }}
        >

          {/* ── Logo + Branding ── */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '26px' }}>
            <div style={{
              width: `${logoSize}px`, height: `${logoSize}px`,
              borderRadius: isMobile ? '17px' : '20px',
              overflow: 'hidden',
              margin: '0 auto',
              marginBottom: isMobile ? '14px' : '18px',
              boxShadow: '0 8px 28px rgba(232,168,56,0.18)',
              border: '2px solid rgba(232,168,56,0.2)',
              animation: 'adminLogoFloat 4s ease infinite, adminGlowPulse 3s ease infinite',
            }}>
              <Image
                src="/image.png" alt="LDCE"
                width={logoSize} height={logoSize}
                className="adl-logo-wrap"
                priority
              />
            </div>

            <h1 style={{
              fontFamily: 'Playfair Display,serif',
              fontWeight: 800,
              fontSize: titleSize,
              color: '#FFFFFF',
              marginBottom: '5px',
              letterSpacing: '-0.3px',
              lineHeight: 1.15,
            }}>
              Admin Panel
            </h1>
            <p style={{
              fontSize: isXs ? '9px' : '10px',
              fontWeight: 700,
              color: '#E8A838',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}>
              LDCE Warriors
            </p>
          </div>

          {/* ── Main card ── */}
          <div style={{
            borderRadius: isMobile ? '20px' : '24px',
            overflow: 'hidden',
            background: 'rgba(21,32,54,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(232,168,56,0.12)',
            boxShadow: `
              0 28px 56px rgba(0,0,0,0.38),
              0 0 0 1px rgba(232,168,56,0.05),
              inset 0 1px 0 rgba(255,255,255,0.03)
            `,
            position: 'relative',
          }}>

            {/* Top shimmer bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg,transparent,#E8A838,#1B2A4A,#E8A838,transparent)',
              backgroundSize: '200% 100%',
              animation: 'adminShimmer 4s linear infinite',
            }} />

            <div style={{ padding: cardPadding }}>

              {/* Security badge */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? '20px' : '26px' }}>
                <div
                  className="adl-security-badge"
                  style={{ padding: isMobile ? '6px 13px' : '7px 16px' }}
                >
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: '#2A9D8F',
                    boxShadow: '0 0 7px rgba(42,157,143,0.5)',
                    animation: 'tealPulse 2s ease infinite',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: isXs ? '9px' : '10px',
                    fontWeight: 700, color: '#E8A838',
                    textTransform: 'uppercase', letterSpacing: '1.5px',
                    fontFamily: 'JetBrains Mono,monospace',
                    whiteSpace: 'nowrap',
                  }}>Secure Access</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin}>

                {/* Email */}
                <div style={{ marginBottom: isMobile ? '14px' : '18px' }}>
                  <label
                    className="adl-label"
                    style={{
                      fontSize: isXs ? '10px' : '11px',
                      marginBottom: '7px',
                    }}
                  >
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Admin Email
                  </label>
                  <input
                    type="email"
                    placeholder="admin@ldcewarriors.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle('email')}
                    required
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: isMobile ? '20px' : '26px' }}>
                  <label
                    className="adl-label"
                    style={{
                      fontSize: isXs ? '10px' : '11px',
                      marginBottom: '7px',
                    }}
                  >
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...inputStyle('password'), paddingRight: '46px' }}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(s => !s)}
                      className="adl-show-pass"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="adl-submit-btn"
                  style={{
                    padding: isMobile ? '13px' : '15px',
                    fontSize: isMobile ? '14px' : '15px',
                    boxShadow: loading ? 'none' : '0 8px 24px rgba(232,168,56,0.22)',
                  }}
                >
                  {loading ? (
                    <>
                      <svg style={{
                        width: '15px', height: '15px',
                        animation: 'spin 1s linear infinite', flexShrink: 0,
                      }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity:.25 }} cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Authenticating…
                    </>
                  ) : (
                    <>
                      🔐 Admin Sign In
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* ── Card footer ── */}
              <div style={{
                textAlign: 'center',
                marginTop: isMobile ? '20px' : '26px',
                paddingTop: isMobile ? '16px' : '20px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>

                {/* Security badges */}
                {!isXs && (
                  <div className="adl-sec-row" style={{ marginBottom: '12px' }}>
                    {['🔒 Encrypted', '🛡️ 2FA Ready', '📡 Secure'].map((badge, i) => (
                      <span key={i} style={{
                        fontSize: '9px', color: 'rgba(255,255,255,0.18)',
                        fontFamily: 'JetBrains Mono,monospace', whiteSpace: 'nowrap',
                      }}>{badge}</span>
                    ))}
                  </div>
                )}

                <p style={{
                  color: 'rgba(255,255,255,0.18)',
                  fontSize: isXs ? '10px' : '11px',
                  marginBottom: '10px', lineHeight: '1.5',
                }}>
                  Restricted to authorized administrators only
                </p>

                <Link href="/" className="adl-back-link">
                  ← Back to Website
                </Link>
              </div>
            </div>
          </div>

          {/* ── Session info ── */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{
              fontFamily: 'JetBrains Mono,monospace',
              fontSize: '8px', color: 'rgba(255,255,255,0.1)',
              letterSpacing: '1px',
            }}>
              SESSION · AES-256 · {new Date().toISOString().split('T')[0]}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}