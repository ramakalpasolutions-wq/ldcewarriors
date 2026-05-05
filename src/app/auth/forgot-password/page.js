// src/app/auth/forgot-password/page.js
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import OTPInput from '@/components/ui/OTPInput'
import AnimatedAuthBackground from '@/components/ui/AnimatedAuthBackground'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [step,      setStep     ] = useState('email')
  const [email,     setEmail    ] = useState('')
  const [otp,       setOtp      ] = useState('')
  const [userId,    setUserId   ] = useState('')
  const [passwords, setPasswords] = useState({ password: '', confirm: '' })
  const [loading,   setLoading  ] = useState(false)
  const [focused,   setFocused  ] = useState(null)
  const router = useRouter()

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

  async function sendOTP(e) {
    e.preventDefault()
    if (!email) { toast.error('Please enter your email'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.userId) setUserId(data.userId)
        setStep('otp')
        toast.success('OTP sent to your email')
      } else {
        toast.error(data.error || 'Failed to send OTP')
      }
    } catch { toast.error('Something went wrong') }
    setLoading(false)
  }

  async function verifyOTP(e) {
    e.preventDefault()
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/verify-reset-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, otp }),
      })
      const data = await res.json()
      if (data.success) {
        setStep('reset')
        toast.success('OTP verified!')
      } else {
        toast.error(data.error || 'Invalid or expired OTP')
      }
    } catch { toast.error('Something went wrong') }
    setLoading(false)
  }

  async function resetPassword(e) {
    e.preventDefault()
    if (!passwords.password || !passwords.confirm) { toast.error('Fill all fields'); return }
    if (passwords.password !== passwords.confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId, otp,
          password:        passwords.password,
          confirmPassword: passwords.confirm,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStep('success')
        toast.success('Password reset successful!')
      } else {
        toast.error(data.error || 'Reset failed')
      }
    } catch { toast.error('Something went wrong') }
    setLoading(false)
  }

  async function resendOTP() {
    setLoading(true)
    try {
      // Re-call forgot-password to get a fresh OTP
      const res  = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.userId) setUserId(data.userId)
        setOtp('')
        toast.success('New OTP sent to your email')
      } else {
        toast.error(data.error || 'Failed to resend OTP')
      }
    } catch { toast.error('Something went wrong') }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .forgot-root {
          min-height:100vh; background:#0D1829;
          display:flex; align-items:center; justify-content:center;
          padding:48px 16px; position:relative; overflow:hidden;
        }
        .forgot-card {
          border-radius:24px; padding:36px;
          background:linear-gradient(145deg,rgba(21,32,54,0.9),rgba(18,28,48,0.95));
          border:1px solid rgba(232,168,56,0.1);
          box-shadow:0 0 60px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.02);
          position:relative; overflow:hidden; backdrop-filter:blur(20px);
          animation:cardFadeIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .forgot-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg,transparent,rgba(232,168,56,0.5),transparent);
        }
        .forgot-submit {
          width:100%; padding:14px; border-radius:12px;
          background:linear-gradient(135deg,#E8A838,#D4922A);
          color:#1B2A4A; font-size:15px; font-weight:800; border:none;
          cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:all 0.3s cubic-bezier(0.16,1,0.3,1);
          box-shadow:0 6px 20px rgba(232,168,56,0.3);
          display:flex; align-items:center; justify-content:center;
          gap:8px; position:relative; overflow:hidden; letter-spacing:0.3px;
        }
        .forgot-submit:hover:not(:disabled) {
          transform:translateY(-2px);
          box-shadow:0 10px 40px rgba(232,168,56,0.45);
        }
        .forgot-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .forgot-link {
          color:#E8A838; text-decoration:none; font-weight:600; transition:all 0.2s;
        }
        .forgot-link:hover { color:#F0C060; }
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
        .step-content { animation:stepSlideIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .input-group  { animation:inputFadeIn 0.4s ease forwards; opacity:0; }
        @keyframes inputFadeIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @media (max-width:480px) { .forgot-card { padding:28px 20px; } .forgot-root { padding:24px 12px; } }
      `}</style>

      <div className="forgot-root">
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

          <div className="forgot-card">

            {/* EMAIL STEP */}
            {step === 'email' && (
              <div className="step-content">
                <div style={{ textAlign:'center', marginBottom:'24px' }}>
                  <div style={{
                    width:'60px', height:'60px', borderRadius:'50%',
                    background:'rgba(232,168,56,0.08)', border:'1px solid rgba(232,168,56,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'28px', margin:'0 auto 14px',
                    animation:'float 3s ease infinite',
                  }}>🔐</div>
                  <h1 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'24px', color:'#FFFFFF', marginBottom:'6px' }}>
                    Forgot Password?
                  </h1>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'14px' }}>
                    Enter your registered email to receive a reset OTP
                  </p>
                </div>
                <form onSubmit={sendOTP}>
                  <div className="input-group" style={{ marginBottom:'20px', animationDelay:'0.1s' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'8px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      Email Address
                    </label>
                    <input
                      type="email" placeholder="your@email.com"
                      value={email} required
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      style={inputStyle('email')}
                    />
                  </div>
                  <button type="submit" disabled={loading} className="forgot-submit">
                    {loading ? (
                      <>
                        <svg style={{ width:'16px', height:'16px', animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Sending OTP…
                      </>
                    ) : 'Send Reset OTP →'}
                  </button>
                </form>
                <p style={{ textAlign:'center', fontSize:'14px', color:'rgba(255,255,255,0.35)', marginTop:'20px' }}>
                  <Link href="/auth/login" className="forgot-link">← Back to Login</Link>
                </p>
              </div>
            )}

            {/* OTP STEP */}
            {step === 'otp' && (
              <div className="step-content" style={{ textAlign:'center' }}>
                <div style={{
                  width:'60px', height:'60px', borderRadius:'50%',
                  background:'rgba(232,168,56,0.08)', border:'1px solid rgba(232,168,56,0.15)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'28px', margin:'0 auto 14px',
                  animation:'float 3s ease infinite',
                }}>📧</div>
                <h2 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'24px', color:'#FFFFFF', marginBottom:'6px' }}>
                  Check Your Email
                </h2>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'14px', marginBottom:'4px' }}>
                  OTP sent to
                </p>
                <p style={{ color:'#E8A838', fontSize:'15px', fontWeight:700, marginBottom:'24px' }}>
                  {email}
                </p>
                <form onSubmit={verifyOTP}>
                  <div style={{ marginBottom:'24px' }}>
                    <OTPInput length={6} value={otp} onChange={setOtp} />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="forgot-submit"
                    style={{ opacity: otp.length !== 6 ? 0.6 : 1 }}
                  >
                    {loading ? 'Verifying…' : 'Verify OTP →'}
                  </button>
                </form>
                <div style={{ marginTop:'16px', display:'flex', justifyContent:'center', gap:'16px' }}>
                  <button
                    onClick={resendOTP}
                    disabled={loading}
                    style={{ background:'none', border:'none', color:'#E8A838', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif', opacity: loading ? 0.5 : 1 }}
                  >
                    🔄 Resend OTP
                  </button>
                  <button
                    onClick={() => { setStep('email'); setOtp('') }}
                    style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontSize:'13px', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}
                  >
                    ← Change Email
                  </button>
                </div>
              </div>
            )}

            {/* RESET STEP */}
            {step === 'reset' && (
              <div className="step-content">
                <div style={{ textAlign:'center', marginBottom:'24px' }}>
                  <div style={{
                    width:'60px', height:'60px', borderRadius:'50%',
                    background:'rgba(232,168,56,0.08)', border:'1px solid rgba(232,168,56,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'28px', margin:'0 auto 14px',
                    animation:'float 3s ease infinite',
                  }}>🔑</div>
                  <h2 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'24px', color:'#FFFFFF', marginBottom:'6px' }}>
                    Set New Password
                  </h2>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'14px' }}>
                    Choose a strong password for your account
                  </p>
                </div>
                <form onSubmit={resetPassword}>
                  <div className="input-group" style={{ marginBottom:'14px', animationDelay:'0.1s' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'8px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      New Password
                    </label>
                    <input
                      type="password" placeholder="Min 8 chars, 1 uppercase, 1 number"
                      value={passwords.password} required
                      onChange={e => setPasswords({ ...passwords, password: e.target.value })}
                      onFocus={() => setFocused('newPass')}
                      onBlur={() => setFocused(null)}
                      style={inputStyle('newPass')}
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom:'20px', animationDelay:'0.2s' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'8px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Confirm New Password
                    </label>
                    <input
                      type="password" placeholder="Repeat new password"
                      value={passwords.confirm} required
                      onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                      onFocus={() => setFocused('confirmPass')}
                      onBlur={() => setFocused(null)}
                      style={inputStyle('confirmPass')}
                    />
                  </div>
                  <button type="submit" disabled={loading} className="forgot-submit">
                    {loading ? (
                      <>
                        <svg style={{ width:'16px', height:'16px', animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Resetting…
                      </>
                    ) : 'Reset Password →'}
                  </button>
                </form>
              </div>
            )}

            {/* SUCCESS */}
            {step === 'success' && (
              <div className="step-content" style={{ textAlign:'center', padding:'24px 0' }}>
                <div style={{
                  width:'80px', height:'80px', borderRadius:'50%',
                  background:'rgba(42,157,143,0.12)', border:'1px solid rgba(42,157,143,0.25)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'40px', margin:'0 auto 20px', animation:'float 3s ease infinite',
                }}>✅</div>
                <h2 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'24px', color:'#FFFFFF', marginBottom:'8px' }}>
                  Password Reset!
                </h2>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'15px', marginBottom:'28px' }}>
                  Your password has been updated. Please login with your new password.
                </p>
                <button onClick={() => router.push('/auth/login')} className="forgot-submit">
                  Login Now →
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}