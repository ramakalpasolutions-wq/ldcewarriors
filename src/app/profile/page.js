// src/app/profile/page.js
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

const c = {
  navy: '#1B2A4A', navyLight: '#243656', navyDark: '#12203A',
  gold: '#E8A838', goldDark: '#D4922A', goldLight: '#F0C060',
  teal: '#2A9D8F', tealDark: '#21867A',
  bg: '#F5F3EF', card: '#FFFFFF', text: '#1A1D23',
  muted: '#6B7280', faint: '#9CA3AF', border: '#E5E7EB',
  red: '#EF4444', redLight: '#FCA5A5',
}

/* ── tiny reusable spinner ── */
function Spin({ size = 16, color = c.gold }) {
  return (
    <svg style={{ width: size, height: size, animation: 'spin 1s linear infinite', flexShrink: 0 }}
      fill="none" viewBox="0 0 24 24">
      <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke={color} strokeWidth="4" />
      <path  style={{ opacity: .75 }} fill={color} d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

/* ══════════════════════════════════════════════
   PASSWORD RESET MODAL
══════════════════════════════════════════════ */
function PasswordResetModal({ user, onClose }) {
  const STEPS = { METHOD: 'method', OTP: 'otp', NEW_PASS: 'new_pass', DONE: 'done' }
  const [step,       setStep      ] = useState(STEPS.METHOD)
  const [method,     setMethod    ] = useState('email')   // 'email' | 'mobile'
  const [otp,        setOtp       ] = useState('')
  const [otpSent,    setOtpSent   ] = useState(false)
  const [sending,    setSending   ] = useState(false)
  const [verifying,  setVerifying ] = useState(false)
  const [resendTimer,setResendTimer] = useState(0)
  const [password,   setPassword  ] = useState('')
  const [confirm,    setConfirm   ] = useState('')
  const [saving,     setSaving    ] = useState(false)
  const [showPw,     setShowPw    ] = useState(false)
  const [showCf,     setShowCf    ] = useState(false)
  const [userId,     setUserId    ] = useState(null)

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setInterval(() => setResendTimer(p => p - 1), 1000)
    return () => clearInterval(t)
  }, [resendTimer])

  // Password strength
  function strength(pw) {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s  // 0-4
  }
  const pwStrength   = strength(password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength]
  const strengthColor = ['', c.red, '#F59E0B', c.teal, '#16a34a'][pwStrength]

  async function sendOTP() {
    setSending(true)
    try {
      // Use forgot-password endpoint which finds user by email
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
      const data = await res.json()
      if (data.success) {
        setUserId(data.userId || user.id)
        setOtpSent(true)
        setStep(STEPS.OTP)
        setResendTimer(60)
        toast.success(`OTP sent to your ${method === 'email' ? 'email' : 'mobile'}`)
      } else {
        toast.error(data.error || 'Failed to send OTP')
      }
    } catch { toast.error('Failed to send OTP') }
    setSending(false)
  }

  async function verifyOTP() {
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    setVerifying(true)
    try {
      // Verify the OTP (password-reset type)
      const res  = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || user.id, otp }),
      })
      const data = await res.json()
      if (data.success) {
        setStep(STEPS.NEW_PASS)
        toast.success('OTP verified!')
      } else {
        toast.error(data.error || 'Invalid OTP')
      }
    } catch { toast.error('Verification failed') }
    setVerifying(false)
  }

  async function savePassword() {
    if (password.length < 8) { toast.error('Min 8 characters'); return }
    if (!/[A-Z]/.test(password)) { toast.error('Need at least 1 uppercase letter'); return }
    if (!/[0-9]/.test(password)) { toast.error('Need at least 1 number'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || user.id,
          otp,
          password,
          confirmPassword: confirm,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStep(STEPS.DONE)
        toast.success('Password changed successfully!')
      } else {
        toast.error(data.error || 'Failed to reset password')
      }
    } catch { toast.error('Failed to reset password') }
    setSaving(false)
  }

  return (
    <div className="pw-overlay" onClick={onClose}>
      <div className="pw-modal" onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className="pw-modal-hd">
          <div className="pw-modal-icon">🔐</div>
          <div style={{ flex: 1 }}>
            <h3 className="pw-modal-title">Change Password</h3>
            <p className="pw-modal-sub">
              {step === STEPS.METHOD  && 'Verify your identity to proceed'}
              {step === STEPS.OTP     && `Enter the OTP sent to your email`}
              {step === STEPS.NEW_PASS && 'Set your new password'}
              {step === STEPS.DONE    && 'Password updated successfully'}
            </p>
          </div>
          <button className="pw-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Step indicator */}
        {step !== STEPS.DONE && (
          <div className="pw-steps">
            {[STEPS.METHOD, STEPS.OTP, STEPS.NEW_PASS].map((s, i) => {
              const idx = [STEPS.METHOD, STEPS.OTP, STEPS.NEW_PASS].indexOf(step)
              const done    = i < idx
              const current = i === idx
              return (
                <div key={s} className="pw-step-wrap">
                  <div className={`pw-step-dot ${done ? 'done' : current ? 'active' : ''}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  {i < 2 && (
                    <div className="pw-step-line" style={{
                      background: done ? c.teal : 'rgba(27,42,74,0.1)',
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── STEP 1: Method ── */}
        {step === STEPS.METHOD && (
          <div className="pw-body">
            <p className="pw-label">Send OTP to</p>
            <div className="pw-method-grid">
              {[
                { id: 'email',  icon: '📧', label: 'Email',  value: user.email  },
              ].map(m => (
                <button
                  key={m.id}
                  className={`pw-method-btn ${method === m.id ? 'active' : ''}`}
                  onClick={() => setMethod(m.id)}
                >
                  <span style={{ fontSize: '22px' }}>{m.icon}</span>
                  <div>
                    <p className="pw-method-label">{m.label}</p>
                    <p className="pw-method-val">{m.value}</p>
                  </div>
                  {method === m.id && (
                    <span className="pw-method-check">✓</span>
                  )}
                </button>
              ))}
            </div>

            <button
              className="pw-btn-primary"
              onClick={sendOTP}
              disabled={sending}
            >
              {sending ? <><Spin size={15} color={c.navy} /> Sending…</> : '📨 Send OTP'}
            </button>
          </div>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === STEPS.OTP && (
          <div className="pw-body">
            <p className="pw-label">Enter 6-digit OTP</p>
            <div className="pw-otp-wrap">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                className="pw-otp-input"
                autoFocus
              />
            </div>
            <p style={{ fontSize: '12px', color: c.faint, textAlign: 'center', marginBottom: '16px' }}>
              Sent to {user.email}
            </p>

            <button
              className="pw-btn-primary"
              onClick={verifyOTP}
              disabled={verifying || otp.length !== 6}
              style={{ opacity: otp.length !== 6 ? 0.6 : 1 }}
            >
              {verifying ? <><Spin size={15} color={c.navy} /> Verifying…</> : '✓ Verify OTP'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
              <button
                className="pw-btn-ghost"
                onClick={() => { setStep(STEPS.METHOD); setOtp('') }}
              >
                ← Back
              </button>
              <button
                className="pw-btn-ghost"
                onClick={sendOTP}
                disabled={resendTimer > 0 || sending}
                style={{ opacity: resendTimer > 0 ? 0.5 : 1 }}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : '🔄 Resend OTP'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === STEPS.NEW_PASS && (
          <div className="pw-body">
            {/* Password field */}
            <div style={{ marginBottom: '14px' }}>
              <label className="pw-label">New Password</label>
              <div className="pw-input-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pw-input"
                  autoFocus
                />
                <button
                  className="pw-eye"
                  onClick={() => setShowPw(p => !p)}
                  type="button"
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Strength bar */}
              {password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    display: 'flex', gap: '4px', marginBottom: '4px',
                  }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: i <= pwStrength ? strengthColor : c.border,
                        transition: 'background 0.2s',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: strengthColor, fontWeight: 600 }}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm field */}
            <div style={{ marginBottom: '18px' }}>
              <label className="pw-label">Confirm Password</label>
              <div className="pw-input-wrap">
                <input
                  type={showCf ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="pw-input"
                  style={{
                    borderColor: confirm && password !== confirm
                      ? 'rgba(239,68,68,0.5)' : undefined,
                  }}
                />
                <button
                  className="pw-eye"
                  onClick={() => setShowCf(p => !p)}
                  type="button"
                >
                  {showCf ? '🙈' : '👁️'}
                </button>
              </div>
              {confirm && password !== confirm && (
                <p style={{ fontSize: '11px', color: c.red, marginTop: '4px', fontWeight: 600 }}>
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Rules */}
            <div className="pw-rules">
              {[
                { ok: password.length >= 8,       label: 'At least 8 characters'   },
                { ok: /[A-Z]/.test(password),      label: 'One uppercase letter'     },
                { ok: /[0-9]/.test(password),      label: 'One number'               },
                { ok: password === confirm && !!confirm, label: 'Passwords match'    },
              ].map(r => (
                <div key={r.label} className="pw-rule">
                  <span style={{ color: r.ok ? '#16a34a' : c.faint }}>{r.ok ? '✓' : '○'}</span>
                  <span style={{ color: r.ok ? c.text : c.faint, fontSize: '12px' }}>{r.label}</span>
                </div>
              ))}
            </div>

            <button
              className="pw-btn-primary"
              onClick={savePassword}
              disabled={saving || pwStrength < 2 || password !== confirm}
              style={{ opacity: (pwStrength < 2 || password !== confirm) ? 0.6 : 1 }}
            >
              {saving ? <><Spin size={15} color={c.navy} /> Saving…</> : '💾 Save New Password'}
            </button>
          </div>
        )}

        {/* ── DONE ── */}
        {step === STEPS.DONE && (
          <div className="pw-body" style={{ textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(22,163,74,0.1)',
              border: '2px solid rgba(22,163,74,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', margin: '0 auto 16px',
            }}>✅</div>
            <h4 style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 800, fontSize: '20px',
              color: c.text, marginBottom: '8px',
            }}>
              Password Changed!
            </h4>
            <p style={{
              color: c.muted, fontSize: '14px',
              lineHeight: 1.65, marginBottom: '24px',
            }}>
              Your password has been updated successfully.
              Use your new password next time you log in.
            </p>
            <button className="pw-btn-primary" onClick={onClose}>
              ✓ Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN PROFILE PAGE
══════════════════════════════════════════════ */
export default function ProfilePage() {
  const [user,         setUser        ] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading,      setLoading     ] = useState(true)
  const [loggingOut,   setLoggingOut  ] = useState(false)
  const [showPwModal,  setShowPwModal ] = useState(false)
  const [activeTab,    setActiveTab   ] = useState('overview') // overview | subscription | security
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      try {
        const stored = localStorage.getItem('ldce_user')
        if (!stored) { router.push('/auth/login?redirect=/profile'); return }
        const res  = await fetch('/api/user/profile')
        const data = await res.json()
        if (data.success) {
          setUser(data.user)
          setSubscription(data.user.subscription || null)
          localStorage.setItem('ldce_user', JSON.stringify({
            id: data.user.id, fullName: data.user.fullName,
            email: data.user.email, mobile: data.user.mobile,
            role: data.user.role,
          }))
          if (data.user.subscription)
            localStorage.setItem('ldce_subscription', JSON.stringify(data.user.subscription))
        } else if (data.deviceMismatch) {
          toast.error('Session expired. Please login again.')
          localStorage.removeItem('ldce_user')
          router.push('/auth/login?redirect=/profile')
        } else {
          toast.error('Failed to load profile')
          router.push('/auth/login?redirect=/profile')
        }
      } catch { toast.error('Failed to load profile') }
      setLoading(false)
    }
    fetchProfile()
  }, [router])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('ldce_user')
      localStorage.removeItem('ldce_token')
      localStorage.removeItem('ldce_subscription')
      toast.success('Logged out')
      router.push('/')
    } catch { toast.error('Logout failed') }
    setLoggingOut(false)
  }

  function fmt(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }
  function fmtS(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  function daysLeft() {
    if (!subscription?.endDate) return 0
    return Math.max(0, Math.ceil(
      (new Date(subscription.endDate) - new Date()) / 86400000
    ))
  }
  function subProgress() {
    if (!subscription?.startDate || !subscription?.endDate) return 0
    const s = new Date(subscription.startDate).getTime()
    const e = new Date(subscription.endDate).getTime()
    return Math.min(100, Math.max(0, ((Date.now() - s) / (e - s)) * 100))
  }

  const isActive = subscription?.status === 'active' && daysLeft() > 0
  const dl        = daysLeft()

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg }}>
        <Navbar />
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100vh - 140px)', paddingTop: '80px',
          gap: '16px',
        }}>
          <Spin size={32} />
          <p style={{ color: c.muted, fontSize: '14px' }}>Loading your profile…</p>
        </div>
      </div>
    )
  }
  if (!user) return null

  const TABS = [
    { id: 'overview',     label: 'Overview',     icon: '👤' },
    { id: 'subscription', label: 'Subscription', icon: '⭐' },
    { id: 'security',     label: 'Security',     icon: '🔒' },
  ]

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Keyframes ── */
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes fadeInUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
        @keyframes modalIn   {
          from { opacity:0; transform:scale(0.93) translateY(12px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer   {
          0%   { background-position:-200% 0; }
          100% { background-position: 200% 0; }
        }

        /* ── Root ── */
        .prof-root { min-height:100vh; background:${c.bg}; }
        .prof-wrap {
          max-width: 1000px; margin: 0 auto;
          padding: 96px 24px 80px;
        }

        /* ── Hero banner ── */
        .prof-hero {
          position: relative; border-radius: 24px; overflow: hidden;
          background: linear-gradient(135deg, ${c.navy} 0%, ${c.navyLight} 100%);
          border: 1px solid rgba(232,168,56,0.15);
          padding: clamp(24px,4vw,36px);
          margin-bottom: 24px;
          animation: fadeInUp 0.45s ease both;
        }
        .prof-hero-grid {
          display: flex; align-items: center;
          gap: clamp(16px,3vw,28px); flex-wrap: wrap;
        }
        .prof-avatar {
          width: clamp(64px,10vw,84px);
          height: clamp(64px,10vw,84px);
          border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg,${c.gold},${c.goldDark});
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display',serif;
          font-weight: 800;
          font-size: clamp(24px,5vw,34px);
          color: ${c.navy};
          box-shadow: 0 8px 28px rgba(232,168,56,0.3);
          border: 3px solid rgba(232,168,56,0.35);
          position: relative;
        }
        .prof-online-dot {
          position: absolute; bottom: 2px; right: 2px;
          width: 14px; height: 14px; border-radius: 50%;
          background: ${c.teal};
          border: 3px solid ${c.navy};
          box-shadow: 0 0 8px rgba(42,157,143,0.5);
        }
        .prof-hero-name {
          font-family: 'Playfair Display',serif;
          font-weight: 800;
          font-size: clamp(18px,3.5vw,26px);
          color: #FFFFFF; margin: 0 0 3px;
          line-height: 1.2;
        }
        .prof-hero-email {
          font-size: clamp(12px,2vw,14px);
          color: rgba(255,255,255,0.48); margin: 0 0 10px;
        }
        .prof-hero-actions {
          display: flex; gap: 8px; flex-wrap: wrap;
          margin-left: auto;
        }

        /* ── Tabs ── */
        .prof-tabs {
          display: flex; gap: 0;
          background: ${c.card};
          border: 1.5px solid ${c.border};
          border-radius: 16px; overflow: hidden;
          margin-bottom: 20px;
          animation: fadeInUp 0.45s ease 0.06s both;
        }
        .prof-tab {
          flex: 1; display: flex; align-items: center;
          justify-content: center; gap: 7px;
          padding: clamp(11px,2vw,14px) 8px;
          font-size: clamp(12px,1.8vw,13px);
          font-weight: 600; cursor: pointer;
          border: none; background: none;
          border-bottom: 2px solid transparent;
          color: ${c.faint};
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .prof-tab.active {
          color: ${c.navy};
          background: rgba(27,42,74,0.04);
          border-bottom-color: ${c.gold};
        }
        .prof-tab:hover:not(.active) {
          color: ${c.muted};
          background: rgba(27,42,74,0.02);
        }
        .prof-tab-icon { font-size: clamp(14px,2vw,16px); }

        /* ── Content card ── */
        .prof-section {
          background: ${c.card};
          border: 1.5px solid ${c.border};
          border-radius: 20px; overflow: hidden;
          animation: fadeInUp 0.4s ease 0.1s both;
        }
        .prof-section-hd {
          padding: 18px 22px;
          border-bottom: 1px solid ${c.border};
          display: flex; align-items: center; gap: 10px;
          background: rgba(27,42,74,0.02);
        }
        .prof-section-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(27,42,74,0.06);
          border: 1px solid rgba(27,42,74,0.08);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .prof-section-title {
          font-weight: 700; font-size: 14px;
          color: ${c.text}; margin: 0;
        }
        .prof-section-sub {
          font-size: 11px; color: ${c.faint}; margin: 1px 0 0;
        }

        /* ── Info rows ── */
        .prof-rows { padding: 0 22px; }
        .prof-row {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid ${c.border};
        }
        .prof-row:last-child { border-bottom: none; }
        .prof-row-icon { font-size: 16px; flex-shrink: 0; }
        .prof-row-lbl {
          font-size: 10px; color: ${c.faint};
          font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.8px; margin-bottom: 2px;
        }
        .prof-row-val {
          font-size: 14px; color: ${c.text}; font-weight: 600;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .prof-badge {
          padding: 3px 10px; border-radius: 999px;
          font-size: 10px; font-weight: 700; flex-shrink: 0;
        }

        /* ── Subscription card ── */
        .prof-sub-card {
          margin: 20px 22px;
          border-radius: 16px; overflow: hidden;
          background: linear-gradient(135deg,${c.navy},${c.navyLight});
          border: 1px solid rgba(232,168,56,0.2);
          padding: 22px;
          position: relative;
        }
        .prof-sub-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          margin-top: 16px;
        }
        .prof-sub-cell {
          padding: 11px 13px; border-radius: 11px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .prof-prog-track {
          height: 6px; border-radius: 3px;
          background: rgba(255,255,255,0.1);
          overflow: hidden; margin-top: 8px;
        }
        .prof-prog-fill {
          height: 100%; border-radius: 3px;
          transition: width 1s ease;
        }

        /* ── Security rows ── */
        .prof-sec-rows { padding: 16px 22px; display: flex; flex-direction: column; gap: 8px; }
        .prof-sec-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 11px 14px; border-radius: 11px;
          background: rgba(27,42,74,0.02);
          border: 1px solid rgba(27,42,74,0.05);
          gap: 12px;
        }
        .prof-sec-lbl { font-size: 13px; color: ${c.muted}; font-weight: 600; }
        .prof-sec-val { font-size: 13px; font-weight: 700; text-align: right; }

        /* ── Action buttons ── */
        .prof-btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 11px;
          background: linear-gradient(135deg,${c.gold},${c.goldDark});
          color: ${c.navy}; font-size: 13px; font-weight: 700;
          border: none; cursor: pointer;
          font-family: 'DM Sans',sans-serif;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(232,168,56,0.25);
          text-decoration: none;
          white-space: nowrap;
        }
        .prof-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(232,168,56,0.35);
        }
        .prof-btn-secondary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 11px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans',sans-serif;
          transition: all 0.2s; white-space: nowrap;
        }
        .prof-btn-secondary:hover {
          background: rgba(255,255,255,0.14);
          color: #fff;
        }
        .prof-btn-danger {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 11px;
          background: rgba(239,68,68,0.08);
          border: 1.5px solid rgba(239,68,68,0.18);
          color: ${c.red}; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans',sans-serif;
          transition: all 0.2s; white-space: nowrap;
        }
        .prof-btn-danger:hover {
          background: rgba(239,68,68,0.14);
          border-color: rgba(239,68,68,0.28);
        }
        .prof-btn-outline {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 11px;
          background: none;
          border: 1.5px solid ${c.border};
          color: ${c.muted}; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans',sans-serif;
          transition: all 0.2s; white-space: nowrap;
        }
        .prof-btn-outline:hover {
          border-color: rgba(27,42,74,0.25);
          color: ${c.text};
        }

        /* ═══════════════════════════════════════
           PASSWORD RESET MODAL
        ═══════════════════════════════════════ */
        .pw-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: overlayIn 0.2s ease both;
        }
        .pw-modal {
          background: ${c.card};
          border-radius: 24px; width: 100%; max-width: 440px;
          box-shadow: 0 28px 70px rgba(0,0,0,0.22);
          animation: modalIn 0.35s cubic-bezier(.34,1.56,.64,1) both;
          overflow: hidden;
        }
        .pw-modal-hd {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 22px 22px 18px;
          border-bottom: 1px solid ${c.border};
          background: rgba(27,42,74,0.02);
        }
        .pw-modal-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: rgba(27,42,74,0.07);
          border: 1px solid rgba(27,42,74,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .pw-modal-title {
          font-family: 'Playfair Display',serif;
          font-weight: 800; font-size: 16px;
          color: ${c.text}; margin: 0 0 2px;
        }
        .pw-modal-sub {
          font-size: 12px; color: ${c.faint}; margin: 0;
        }
        .pw-modal-close {
          margin-left: auto; width: 30px; height: 30px;
          border-radius: 8px; background: none;
          border: 1.5px solid ${c.border};
          color: ${c.faint}; font-size: 14px;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s;
        }
        .pw-modal-close:hover { background: rgba(239,68,68,0.07); color: ${c.red}; border-color: rgba(239,68,68,0.2); }

        /* Steps */
        .pw-steps {
          display: flex; align-items: center;
          padding: 16px 22px 0;
        }
        .pw-step-wrap { display: flex; align-items: center; flex: 1; }
        .pw-step-wrap:last-child { flex: none; }
        .pw-step-dot {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(27,42,74,0.07);
          border: 1.5px solid ${c.border};
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: ${c.faint};
          flex-shrink: 0; transition: all 0.3s;
        }
        .pw-step-dot.active {
          background: ${c.navy}; border-color: ${c.navy};
          color: #fff; box-shadow: 0 4px 12px rgba(27,42,74,0.25);
        }
        .pw-step-dot.done {
          background: ${c.teal}; border-color: ${c.teal}; color: #fff;
        }
        .pw-step-line {
          flex: 1; height: 2px; border-radius: 2px;
          margin: 0 6px; transition: background 0.3s;
        }

        /* Body */
        .pw-body { padding: 20px 22px 22px; display: flex; flex-direction: column; gap: 14px; }

        /* Method selector */
        .pw-label { font-size: 12px; font-weight: 700; color: ${c.navy}; margin: 0; }
        .pw-method-grid { display: flex; flex-direction: column; gap: 8px; }
        .pw-method-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 14px; border-radius: 12px;
          border: 1.5px solid ${c.border};
          background: #FAFAFA; cursor: pointer;
          text-align: left; transition: all 0.2s;
          font-family: 'DM Sans',sans-serif;
        }
        .pw-method-btn:hover {
          border-color: rgba(232,168,56,0.3);
          background: rgba(232,168,56,0.03);
        }
        .pw-method-btn.active {
          border-color: ${c.navy};
          background: rgba(27,42,74,0.04);
          box-shadow: 0 0 0 3px rgba(27,42,74,0.06);
        }
        .pw-method-label { font-size: 13px; font-weight: 700; color: ${c.text}; margin: 0 0 1px; }
        .pw-method-val   { font-size: 12px; color: ${c.faint}; margin: 0; }
        .pw-method-check {
          margin-left: auto; width: 22px; height: 22px;
          border-radius: 50%; background: ${c.navy};
          color: #fff; font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* OTP input */
        .pw-otp-wrap { display: flex; justify-content: center; }
        .pw-otp-input {
          width: 200px; text-align: center; letter-spacing: 10px;
          font-size: 28px; font-weight: 700; font-family: 'JetBrains Mono',monospace;
          color: ${c.navy}; padding: 14px;
          border: 2px solid ${c.border}; border-radius: 14px;
          background: #FAFAFA; outline: none;
          transition: border 0.2s, box-shadow 0.2s;
        }
        .pw-otp-input:focus {
          border-color: rgba(27,42,74,0.4);
          box-shadow: 0 0 0 3px rgba(27,42,74,0.07);
          background: #fff;
        }

        /* Password input */
        .pw-input-wrap { position: relative; }
        .pw-input {
          width: 100%; padding: 11px 40px 11px 13px;
          border: 1.5px solid ${c.border}; border-radius: 11px;
          font-size: 14px; color: ${c.text};
          font-family: 'DM Sans',sans-serif;
          background: #FAFAFA; outline: none;
          transition: border 0.2s, box-shadow 0.2s;
        }
        .pw-input:focus {
          border-color: rgba(27,42,74,0.4);
          box-shadow: 0 0 0 3px rgba(27,42,74,0.07);
          background: #fff;
        }
        .pw-eye {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; font-size: 16px;
          line-height: 1; padding: 2px;
        }

        /* Rules checklist */
        .pw-rules {
          display: flex; flex-direction: column; gap: 5px;
          padding: 12px 14px; border-radius: 10px;
          background: rgba(27,42,74,0.02);
          border: 1px solid rgba(27,42,74,0.06);
        }
        .pw-rule {
          display: flex; align-items: center; gap: 8px;
        }

        /* Modal primary btn */
        .pw-btn-primary {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; width: 100%; padding: 13px;
          border-radius: 12px; border: none;
          background: linear-gradient(135deg,${c.gold},${c.goldDark});
          color: ${c.navy}; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans',sans-serif;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(232,168,56,0.25);
        }
        .pw-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(232,168,56,0.35);
        }
        .pw-btn-primary:disabled { cursor: not-allowed; }

        .pw-btn-ghost {
          flex: 1; padding: 9px 14px; border-radius: 10px;
          background: none; border: 1.5px solid ${c.border};
          color: ${c.muted}; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans',sans-serif;
          transition: all 0.2s;
        }
        .pw-btn-ghost:hover:not(:disabled) {
          border-color: rgba(27,42,74,0.2); color: ${c.text};
        }
        .pw-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .prof-wrap { padding: 84px 14px 56px; }
          .prof-hero  { padding: 20px 16px; border-radius: 18px; }
          .prof-hero-actions { width: 100%; }
          .prof-tabs  { border-radius: 12px; }
          .prof-tab   { flex-direction: column; gap: 3px; padding: 10px 4px; font-size: 11px; }
          .prof-section { border-radius: 16px; }
          .prof-section-hd { padding: 14px 16px; }
          .prof-rows  { padding: 0 16px; }
          .prof-row   { flex-wrap: wrap; gap: 8px; }
          .prof-sec-rows { padding: 12px 16px; }
          .prof-sub-card { margin: 14px 16px; }
          .prof-sub-grid { grid-template-columns: 1fr 1fr; }
          .pw-modal   { border-radius: 20px 20px 0 0; max-width: 100%; }
          .pw-overlay { align-items: flex-end; padding: 0; }
          .pw-body    { padding: 16px 18px 24px; }
          .pw-modal-hd { padding: 18px 18px 14px; }
          .pw-steps   { padding: 12px 18px 0; }
          .pw-otp-input { width: 180px; font-size: 24px; letter-spacing: 8px; }
        }
        @media (max-width: 400px) {
          .prof-sub-grid { grid-template-columns: 1fr; }
          .prof-tab-icon { display: none; }
        }
      `}</style>

      {/* Password Reset Modal */}
      {showPwModal && (
        <PasswordResetModal user={user} onClose={() => setShowPwModal(false)} />
      )}

      <div className="prof-root">
        <Navbar />
        <div className="prof-wrap">

          {/* ── Hero Banner ── */}
          <div className="prof-hero">
            {/* Gold top line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: `linear-gradient(90deg,transparent,${c.gold},transparent)`,
            }} />
            {/* Grid bg */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `linear-gradient(rgba(232,168,56,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(232,168,56,0.04) 1px,transparent 1px)`,
              backgroundSize: '40px 40px', pointerEvents: 'none',
            }} />
            {/* Orb */}
            <div style={{
              position: 'absolute', top: '-60px', right: '-60px',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(232,168,56,0.08) 0%,transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div className="prof-hero-grid" style={{ position: 'relative' }}>
              {/* Avatar */}
              <div className="prof-avatar">
                {user.fullName?.charAt(0).toUpperCase()}
                <div className="prof-online-dot" />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="prof-hero-name">{user.fullName}</h2>
                <p className="prof-hero-email">{user.email}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {isActive ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '4px 12px', borderRadius: '999px',
                      background: 'rgba(232,168,56,0.1)',
                      border: '1px solid rgba(232,168,56,0.22)',
                      fontSize: '11px', fontWeight: 700, color: c.gold,
                    }}>
                      ⭐ Premium Member
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '4px 12px', borderRadius: '999px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '11px', fontWeight: 600,
                      color: 'rgba(255,255,255,0.45)',
                    }}>
                      Free Account
                    </span>
                  )}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '999px',
                    background: 'rgba(42,157,143,0.12)',
                    border: '1px solid rgba(42,157,143,0.22)',
                    fontSize: '10px', fontWeight: 700, color: '#4DD9CB',
                  }}>
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: c.teal,
                      boxShadow: '0 0 6px rgba(42,157,143,0.5)',
                      animation: 'pulse 2s infinite',
                    }} />
                    Active
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="prof-hero-actions">
                <Link href="/classes" className="prof-btn-secondary">
                  🎥 Classes
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="prof-btn-secondary"
                  style={{ color: '#FCA5A5', borderColor: 'rgba(239,68,68,0.25)' }}
                >
                  {loggingOut ? <Spin size={14} color="#FCA5A5" /> : '🚪'}
                  {loggingOut ? 'Leaving…' : 'Logout'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="prof-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`prof-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="prof-tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════
               TAB: OVERVIEW
          ══════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Personal details */}
              <div className="prof-section">
                <div className="prof-section-hd">
                  <div className="prof-section-icon">👤</div>
                  <div>
                    <p className="prof-section-title">Personal Information</p>
                    <p className="prof-section-sub">Your account details</p>
                  </div>
                </div>
                <div className="prof-rows">
                  {[
                    { icon: '👤', label: 'Full Name', value: user.fullName },
                    { icon: '📧', label: 'Email Address', value: user.email,
                      badge: user.isEmailVerified
                        ? { text:'Verified', color: c.teal, bg:'rgba(42,157,143,0.08)', border:'rgba(42,157,143,0.2)' }
                        : { text:'Unverified', color: c.red, bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.2)' }
                    },
                    { icon: '📱', label: 'Mobile Number', value: user.mobile,
                      badge: user.isMobileVerified
                        ? { text:'Verified', color: c.teal, bg:'rgba(42,157,143,0.08)', border:'rgba(42,157,143,0.2)' }
                        : { text:'Unverified', color: c.red, bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.2)' }
                    },
                    { icon: '🎓', label: 'Account Role', value: user.role === 'admin' ? 'Administrator' : 'Student' },
                    { icon: '📅', label: 'Member Since', value: fmt(user.createdAt) },
                  ].map((row, i, arr) => (
                    <div key={row.label} className="prof-row"
                      style={{ borderBottom: i < arr.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                      <span className="prof-row-icon">{row.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="prof-row-lbl">{row.label}</p>
                        <p className="prof-row-val">{row.value}</p>
                      </div>
                      {row.badge && (
                        <span className="prof-badge" style={{
                          color: row.badge.color,
                          background: row.badge.bg,
                          border: `1px solid ${row.badge.border}`,
                        }}>
                          {row.badge.text}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Address */}
              {(user.addressLine || user.addressCity || user.addressState) && (
                <div className="prof-section">
                  <div className="prof-section-hd">
                    <div className="prof-section-icon">📍</div>
                    <div>
                      <p className="prof-section-title">Address</p>
                      <p className="prof-section-sub">Registered address</p>
                    </div>
                  </div>
                  <div style={{ padding: '16px 22px' }}>
                    <div style={{
                      padding: '14px 16px', borderRadius: '12px',
                      background: 'rgba(27,42,74,0.02)',
                      border: '1px solid rgba(27,42,74,0.06)',
                    }}>
                      {user.addressLine && (
                        <p style={{ color: c.text, fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                          {user.addressLine}
                        </p>
                      )}
                      <p style={{ color: c.muted, fontSize: '13px' }}>
                        {[user.addressCity, user.addressState, user.addressPincode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

             
            </div>
          )}

          {/* ══════════════════════════════════
               TAB: SUBSCRIPTION
          ══════════════════════════════════ */}
          {activeTab === 'subscription' && (
            <div className="prof-section">
              <div className="prof-section-hd">
                <div className="prof-section-icon">⭐</div>
                <div>
                  <p className="prof-section-title">Subscription</p>
                  <p className="prof-section-sub">
                    {isActive ? 'Premium plan active' : 'No active subscription'}
                  </p>
                </div>
                <span style={{
                  marginLeft: 'auto',
                  padding: '4px 12px', borderRadius: '999px',
                  fontSize: '11px', fontWeight: 700,
                  background: isActive ? 'rgba(42,157,143,0.1)' : 'rgba(107,114,128,0.08)',
                  color:      isActive ? '#4DD9CB' : c.faint,
                  border:     isActive ? '1px solid rgba(42,157,143,0.2)' : `1px solid ${c.border}`,
                }}>
                  {isActive ? '● Active' : '○ Inactive'}
                </span>
              </div>

              {isActive ? (
                <>
                  <div className="prof-sub-card">
                    {/* Shimmer top */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                      background: `linear-gradient(90deg,${c.gold},${c.goldLight},${c.gold})`,
                    }} />

                    {/* Days remaining */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px',
                    }}>
                      <div>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px', margin: '0 0 4px' }}>
                          Time Remaining
                        </p>
                        <p style={{
                          fontFamily: 'Playfair Display,serif',
                          fontWeight: 800,
                          fontSize: 'clamp(28px,5vw,40px)',
                          color: dl <= 7 ? '#FCA5A5' : c.gold,
                          lineHeight: 1, margin: 0,
                        }}>
                          {dl}
                          <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', marginLeft: '6px', fontWeight: 400 }}>
                            days
                          </span>
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>
                          Amount Paid
                        </p>
                        <p style={{
                          fontFamily: 'Playfair Display,serif',
                          fontWeight: 800, fontSize: 'clamp(22px,4vw,32px)',
                          color: '#fff', lineHeight: 1, margin: 0,
                        }}>
                          ₹{subscription?.amount || 0}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                          Started {fmtS(subscription?.startDate)}
                        </span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                          Ends {fmtS(subscription?.endDate)}
                        </span>
                      </div>
                      <div className="prof-prog-track">
                        <div className="prof-prog-fill" style={{
                          width: `${100 - subProgress()}%`,
                          background: dl <= 7
                            ? 'linear-gradient(90deg,#EF4444,#F87171)'
                            : `linear-gradient(90deg,${c.gold},${c.goldLight})`,
                          boxShadow: `0 0 8px ${dl <= 7 ? 'rgba(239,68,68,0.3)' : 'rgba(232,168,56,0.3)'}`,
                        }} />
                      </div>
                    </div>

                    {/* Grid */}
                    <div className="prof-sub-grid">
                      {[
                        { icon: '💳', label: 'Status',   value: 'Active'                        },
                        { icon: '💰', label: 'Discount',  value: subscription?.discountAmount > 0
                          ? `₹${subscription.discountAmount} saved` : 'No discount'             },
                        { icon: '📅', label: 'Start Date', value: fmtS(subscription?.startDate) },
                        { icon: '🏁', label: 'End Date',   value: fmtS(subscription?.endDate)   },
                      ].map(item => (
                        <div key={item.label} className="prof-sub-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '11px' }}>{item.icon}</span>
                            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.7px' }}>{item.label}</span>
                          </div>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0 }}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Coupon */}
                    {subscription?.couponCode && (
                      <div style={{
                        marginTop: '12px', padding: '9px 13px', borderRadius: '10px',
                        background: 'rgba(42,157,143,0.1)',
                        border: '1px solid rgba(42,157,143,0.18)',
                        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                      }}>
                        <span>🎟️</span>
                        <span style={{
                          fontFamily: 'JetBrains Mono,monospace',
                          fontSize: '12px', fontWeight: 700,
                          color: '#4DD9CB', letterSpacing: '1px',
                        }}>
                          {subscription.couponCode}
                        </span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
                          Coupon Applied
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Razorpay payment ID */}
                  {subscription?.razorpayPaymentId && (
                    <div style={{ padding: '0 22px 18px' }}>
                      <p style={{ fontSize: '11px', color: c.faint, marginBottom: '4px', fontWeight: 600 }}>
                        Payment Reference
                      </p>
                      <p style={{
                        fontFamily: 'JetBrains Mono,monospace',
                        fontSize: '12px', color: c.muted,
                      }}>
                        {subscription.razorpayPaymentId}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* No subscription */
                <div style={{ padding: '40px 22px', textAlign: 'center' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '18px',
                    background: 'rgba(232,168,56,0.07)',
                    border: `1px solid rgba(232,168,56,0.15)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', margin: '0 auto 16px',
                  }}>⭐</div>
                  <h4 style={{
                    fontFamily: 'Playfair Display,serif',
                    fontWeight: 800, fontSize: '18px',
                    color: c.text, marginBottom: '8px',
                  }}>
                    Unlock Premium Access
                  </h4>
                  <p style={{
                    color: c.muted, fontSize: '14px',
                    lineHeight: 1.65, marginBottom: '22px', maxWidth: '320px', margin: '0 auto 22px',
                  }}>
                    Get access to 200+ expert video lectures across all topics with a single subscription.
                  </p>
                  <Link href="/premium" className="prof-btn-primary">
                    ⭐ Get Premium
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════
               TAB: SECURITY
          ══════════════════════════════════ */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Account status */}
              <div className="prof-section">
                <div className="prof-section-hd">
                  <div className="prof-section-icon">🛡️</div>
                  <div>
                    <p className="prof-section-title">Account Status</p>
                    <p className="prof-section-sub">Security and device information</p>
                  </div>
                </div>
                <div className="prof-sec-rows">
                  {[
                    { label: 'Account Status',
                      value: user.isActive ? '● Active' : '● Suspended',
                      color: user.isActive ? c.teal : c.red },
                    { label: 'Email Verification',
                      value: user.isEmailVerified ? '✓ Verified' : '✗ Not Verified',
                      color: user.isEmailVerified ? c.teal : c.red },
                    { label: 'Mobile Verification',
                      value: user.isMobileVerified ? '✓ Verified' : '✗ Not Verified',
                      color: user.isMobileVerified ? c.teal : c.red },
                    { label: 'Device Binding',
                      value: user.deviceId ? '📱 1 device bound' : 'No device',
                      color: user.deviceId ? c.teal : c.faint },
                    { label: 'Last Login', value: 'This session', color: c.muted },
                  ].map(item => (
                    <div key={item.label} className="prof-sec-row">
                      <span className="prof-sec-lbl">{item.label}</span>
                      <span className="prof-sec-val" style={{ color: item.color }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Change password */}
              <div className="prof-section">
                <div className="prof-section-hd">
                  <div className="prof-section-icon">🔑</div>
                  <div>
                    <p className="prof-section-title">Password</p>
                    <p className="prof-section-sub">Update your login password</p>
                  </div>
                </div>
                <div style={{ padding: '20px 22px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px',
                    padding: '18px', borderRadius: '14px',
                    background: 'rgba(27,42,74,0.02)',
                    border: `1.5px solid ${c.border}`,
                  }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '14px', color: c.text, margin: '0 0 3px' }}>
                        Change Password
                      </p>
                      <p style={{ fontSize: '12px', color: c.faint, margin: 0 }}>
                        We'll send an OTP to your email to verify your identity
                      </p>
                    </div>
                    <button
                      className="prof-btn-primary"
                      onClick={() => setShowPwModal(true)}
                    >
                      🔐 Change Password
                    </button>
                  </div>

                  {/* Password tips */}
                  <div style={{
                    marginTop: '14px', padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'rgba(232,168,56,0.04)',
                    border: '1px solid rgba(232,168,56,0.12)',
                  }}>
                    <p style={{
                      fontSize: '11px', fontWeight: 700, color: '#92611A',
                      textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px',
                    }}>
                      💡 Password Tips
                    </p>
                    {[
                      'Use at least 8 characters',
                      'Include uppercase letters and numbers',
                      'Avoid using easily guessable words',
                      'Never share your password with anyone',
                    ].map(tip => (
                      <p key={tip} style={{
                        fontSize: '12px', color: c.muted,
                        margin: '0 0 4px', display: 'flex', gap: '6px',
                      }}>
                        <span style={{ color: c.gold, flexShrink: 0 }}>→</span> {tip}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              <div className="prof-section">
                <div className="prof-section-hd">
                  <div className="prof-section-icon">⚠️</div>
                  <div>
                    <p className="prof-section-title">Session</p>
                    <p className="prof-section-sub">Manage your active session</p>
                  </div>
                </div>
                <div style={{ padding: '16px 22px 20px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '13px', color: c.text, margin: '0 0 2px' }}>
                        Sign out of this device
                      </p>
                      <p style={{ fontSize: '12px', color: c.faint, margin: 0 }}>
                        You'll need to log in again on this device
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="prof-btn-danger"
                    >
                      {loggingOut ? <Spin size={13} color={c.red} /> : '🚪'}
                      {loggingOut ? 'Signing out…' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
        <Footer />
      </div>
    </>
  )
}