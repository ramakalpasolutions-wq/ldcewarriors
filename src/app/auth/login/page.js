// src/app/auth/login/page.js
'use client'
import { Suspense } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import OTPInput from '@/components/ui/OTPInput'
import AnimatedAuthBackground from '@/components/ui/AnimatedAuthBackground'
import toast from 'react-hot-toast'

// ── Inner component that uses useSearchParams ──
function LoginContent() {
  const [step,    setStep   ] = useState('credentials')
  const [form,    setForm   ] = useState({ identifier: '', password: '' })
  const [otp,     setOtp    ] = useState('')
  const [userId,  setUserId ] = useState('')
  const [email,   setEmail  ] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [focused, setFocused] = useState(null)
  const router = useRouter()
  const params   = useSearchParams()
  const redirect = params.get('redirect') || '/'

  function inputStyle(field) {
    const f = focused === field
    return {
      width:'100%', padding:'13px 16px', borderRadius:'12px',
      background: f ? 'rgba(232,168,56,0.04)' : 'rgba(255,255,255,0.03)',
      border: f ? '1.5px solid rgba(232,168,56,0.5)' : '1px solid rgba(255,255,255,0.08)',
      color:'#F5F5F5', fontSize:'14px', outline:'none',
      fontFamily:'DM Sans, sans-serif', transition:'all 0.3s ease',
      boxShadow: f
        ? '0 0 0 3px rgba(232,168,56,0.08), 0 0 20px rgba(232,168,56,0.05)'
        : 'none',
      backdropFilter:'blur(10px)',
    }
  }

  function startResendTimer() {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer(p => {
        if (p <= 1) { clearInterval(interval); return 0 }
        return p - 1
      })
    }, 1000)
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!form.identifier || !form.password) {
      toast.error('Please enter email/mobile and password'); return
    }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success && data.step === 'otp') {
        setUserId(data.userId)
        setEmail(form.identifier.includes('@') ? form.identifier : '(registered email)')
        setStep('otp')
        startResendTimer()
        toast.success('OTP sent to your email!')
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch {
      toast.error('Something went wrong')
    }
    setLoading(false)
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    if (otp.length !== 6) { toast.error('Please enter the 6-digit OTP'); return }
    setLoading(true)
    try {
      const deviceId = localStorage.getItem('ldce_deviceId') || crypto.randomUUID()
      const res  = await fetch('/api/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, otp, type: 'login', deviceId }),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('ldce_user',     JSON.stringify(data.user))
        localStorage.setItem('ldce_token',    data.token)
        localStorage.setItem('ldce_deviceId', deviceId)
        toast.success(`Welcome back, ${data.user.fullName?.split(' ')[0]}!`)
        router.push(redirect)
      } else {
        toast.error(data.error || 'Invalid OTP')
      }
    } catch {
      toast.error('OTP verification failed')
    }
    setLoading(false)
  }

  async function handleResend() {
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, type: 'login' }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('New OTP sent to your email!')
        startResendTimer()
        setOtp('')
      } else {
        toast.error(data.error || 'Failed to resend OTP')
      }
    } catch {
      toast.error('Failed to resend OTP')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .auth-root {
          min-height:100vh; background:#0D1829;
          display:flex; align-items:center; justify-content:center;
          padding:48px 16px; position:relative; overflow:hidden;
        }
        .auth-card {
          border-radius:24px; padding:36px;
          background:linear-gradient(145deg,rgba(21,32,54,0.9),rgba(18,28,48,0.95));
          border:1px solid rgba(232,168,56,0.1);
          box-shadow:0 0 60px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.02);
          position:relative; overflow:hidden; backdrop-filter:blur(20px);
          animation:cardFadeIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .auth-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg,transparent,rgba(232,168,56,0.5),transparent);
        }
        .auth-submit {
          width:100%; padding:14px; border-radius:12px;
          background:linear-gradient(135deg,#E8A838,#D4922A);
          color:#1B2A4A; font-size:15px; font-weight:800; border:none;
          cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:all 0.3s cubic-bezier(0.16,1,0.3,1);
          box-shadow:0 6px 20px rgba(232,168,56,0.3);
          display:flex; align-items:center; justify-content:center;
          gap:8px; position:relative; overflow:hidden; letter-spacing:0.3px;
        }
        .auth-submit:hover:not(:disabled) {
          transform:translateY(-2px);
          box-shadow:0 10px 40px rgba(232,168,56,0.45);
        }
        .auth-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .auth-link {
          color:#E8A838; text-decoration:none; font-weight:600; transition:all 0.2s;
        }
        .auth-link:hover { color:#F0C060; }
        input::placeholder { color:rgba(255,255,255,0.2); }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes float {
          0%,100% { transform:translateY(0) scale(1); }
          50%      { transform:translateY(-8px) scale(1.05); }
        }
        @keyframes cardFadeIn {
          from { opacity:0; transform:translateY(20px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes stepSlideIn {
          from { opacity:0; transform:translateX(30px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow:0 0 20px rgba(232,168,56,0.3); }
          50%     { box-shadow:0 0 30px rgba(232,168,56,0.5),0 0 60px rgba(232,168,56,0.15); }
        }
        @keyframes inputFadeIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .step-content { animation:stepSlideIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .input-group  { animation:inputFadeIn 0.4s ease forwards; opacity:0; }
        @media (max-width:480px) { .auth-card { padding:28px 20px; } .auth-root { padding:24px 12px; } }
      `}</style>

      <div className="auth-root">
        <AnimatedAuthBackground />

        <div style={{ width:'100%', maxWidth:'440px', position:'relative', zIndex:1 }}>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:'12px', textDecoration:'none' }}>
              <div style={{
                width:'48px', height:'48px', borderRadius:'14px',
                background:'linear-gradient(135deg,#E8A838,#D4922A)',
                display:'flex', alignItems:'center', justifyContent:'center',
                animation:'glowPulse 3s ease infinite',
              }}>
                <span style={{ color:'#1B2A4A', fontWeight:800, fontSize:'22px', fontFamily:'Playfair Display,serif' }}>L</span>
              </div>
              <div>
                <span style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'24px', color:'#FFFFFF', display:'block', lineHeight:1 }}>LDCE</span>
                <span style={{ fontSize:'9px', fontWeight:700, color:'#E8A838', letterSpacing:'3px', textTransform:'uppercase' }}>Warriors</span>
              </div>
            </Link>
          </div>

          <div className="auth-card">

            {/* ── CREDENTIALS STEP ── */}
            {step === 'credentials' && (
              <div className="step-content">
                <div style={{ textAlign:'center', marginBottom:'28px' }}>
                  <h1 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'26px', color:'#FFFFFF', marginBottom:'6px' }}>
                    Welcome Back
                  </h1>
                  <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'14px' }}>
                    Sign in to continue your prep journey
                  </p>
                </div>

                <form onSubmit={handleLogin}>
                  <div className="input-group" style={{ marginBottom:'16px', animationDelay:'0.1s' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'8px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      Email or Mobile Number
                    </label>
                    <input
                      type="text" placeholder="email@example.com or 9876543210"
                      value={form.identifier} autoComplete="username"
                      onChange={e => setForm({ ...form, identifier: e.target.value })}
                      onFocus={() => setFocused('identifier')}
                      onBlur={() => setFocused(null)}
                      style={inputStyle('identifier')}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom:'24px', animationDelay:'0.2s' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                      <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'rgba(255,255,255,0.4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        Password
                      </label>
                      <Link href="/auth/forgot-password" className="auth-link" style={{ fontSize:'11px' }}>
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      type="password" placeholder="Enter your password"
                      value={form.password} autoComplete="current-password"
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      style={inputStyle('password')}
                    />
                  </div>

                  <button type="submit" disabled={loading} className="auth-submit">
                    {loading ? (
                      <>
                        <svg style={{ width:'16px', height:'16px', animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Signing in…
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <p style={{ textAlign:'center', fontSize:'14px', color:'rgba(255,255,255,0.35)', marginTop:'24px' }}>
                  Don&apos;t have an account?{' '}
                  <Link href="/auth/register" className="auth-link">Register Free</Link>
                </p>
              </div>
            )}

            {/* ── OTP STEP ── */}
            {step === 'otp' && (
              <div className="step-content">
                <div style={{ textAlign:'center', marginBottom:'24px' }}>
                  <div style={{
                    width:'60px', height:'60px', borderRadius:'50%',
                    background:'rgba(232,168,56,0.08)', border:'1px solid rgba(232,168,56,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'28px', margin:'0 auto 14px',
                    boxShadow:'0 0 30px rgba(232,168,56,0.1)', animation:'float 3s ease infinite',
                  }}>📧</div>
                  <h1 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'24px', color:'#FFFFFF', marginBottom:'6px' }}>
                    Check Your Email
                  </h1>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'14px', marginBottom:'4px' }}>
                    We sent a 6-digit OTP to
                  </p>
                  <p style={{ color:'#E8A838', fontSize:'15px', fontWeight:700, marginBottom:0 }}>
                    {email}
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP}>
                  <div style={{ marginBottom:'24px' }}>
                    <OTPInput length={6} value={otp} onChange={setOtp} disabled={loading} />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="auth-submit"
                    style={{ opacity: otp.length !== 6 ? 0.6 : 1 }}
                  >
                    {loading ? (
                      <>
                        <svg style={{ width:'16px', height:'16px', animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Verifying…
                      </>
                    ) : 'Verify & Login →'}
                  </button>

                  <div style={{ textAlign:'center', marginTop:'20px' }}>
                    {resendTimer > 0 ? (
                      <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'13px' }}>
                        Resend OTP in{' '}
                        <span style={{ color:'#E8A838', fontFamily:'JetBrains Mono,monospace' }}>
                          {resendTimer}s
                        </span>
                      </p>
                    ) : (
                      <div style={{ display:'flex', justifyContent:'center', gap:'16px' }}>
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={loading}
                          className="auth-link"
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontFamily:'DM Sans,sans-serif', opacity: loading ? 0.5 : 1 }}
                        >
                          🔄 Resend OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStep('credentials'); setOtp('') }}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:'13px', color:'rgba(255,255,255,0.35)', fontFamily:'DM Sans,sans-serif' }}
                        >
                          ← Go back
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

// ── Fallback shown while LoginContent loads ──
function LoginFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1829',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid rgba(232,168,56,0.2)',
        borderTopColor: '#E8A838',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Default export wraps LoginContent in Suspense ──
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}