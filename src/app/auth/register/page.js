// src/app/auth/register/page.js
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import OTPInput from '@/components/ui/OTPInput'
import AnimatedAuthBackground from '@/components/ui/AnimatedAuthBackground'
import toast from 'react-hot-toast'

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir',
  'Ladakh','Puducherry',
]

export default function RegisterPage() {
  // Only 3 steps now: form → email-otp → success
  const [step,    setStep   ] = useState('form')
  const [form,    setForm   ] = useState({
    fullName: '', email: '', mobile: '', password: '', confirmPassword: '',
    address: { line: '', city: '', state: '', pincode: '' },
  })
  const [userId,  setUserId ] = useState('')
  const [otp,     setOtp    ] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(null)
  const router = useRouter()

  function update(field, val) { setForm(p => ({ ...p, [field]: val })) }
  function updateAddress(field, val) {
    setForm(p => ({ ...p, address: { ...p.address, [field]: val } }))
  }

  function inputStyle(field) {
    const f = focused === field
    return {
      width: '100%', padding: '12px 16px', borderRadius: '12px',
      background: f ? 'rgba(232,168,56,0.04)' : 'rgba(255,255,255,0.03)',
      border: f ? '1.5px solid rgba(232,168,56,0.5)' : '1px solid rgba(255,255,255,0.08)',
      color: '#F5F5F5', fontSize: '14px', outline: 'none',
      fontFamily: 'DM Sans, sans-serif', transition: 'all 0.3s ease',
      boxShadow: f
        ? '0 0 0 3px rgba(232,168,56,0.08), 0 0 20px rgba(232,168,56,0.05)'
        : 'none',
      backdropFilter: 'blur(10px)',
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.mobile || !form.password || !form.confirmPassword) {
      toast.error('Please fill all required fields'); return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match'); return
    }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setUserId(data.userId)
        setStep('email-otp')
        toast.success('OTP sent to your email!')
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch {
      toast.error('Something went wrong')
    }
    setLoading(false)
  }

  async function verifyOTP() {
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, otp, type: 'email' }),
      })
      const data = await res.json()
      if (data.success) {
        setStep('success')
        toast.success('Email verified! Account ready.')
      } else {
        toast.error(data.error || 'Invalid OTP')
      }
    } catch {
      toast.error('Verification failed')
    }
    setLoading(false)
  }

  async function resendOTP() {
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, type: 'email' }),
      })
      const data = await res.json()
      if (data.success) toast.success('New OTP sent to your email!')
      else toast.error(data.error || 'Failed to resend OTP')
    } catch {
      toast.error('Failed to resend OTP')
    }
    setLoading(false)
  }

  // Progress: form=1, email-otp=2, success=3
  const steps  = ['form', 'email-otp', 'success']
  const curIdx = steps.indexOf(step)

  return (
    <>
      <style>{`
        .reg-root {
          min-height:100vh; background:#0D1829;
          display:flex; align-items:center; justify-content:center;
          padding:48px 16px; position:relative; overflow:hidden;
        }
        .reg-card {
          border-radius:24px; padding:36px;
          background:linear-gradient(145deg,rgba(21,32,54,0.9),rgba(18,28,48,0.95));
          border:1px solid rgba(232,168,56,0.1);
          box-shadow:0 0 60px rgba(0,0,0,0.5),0 0 120px rgba(232,168,56,0.03),
                     inset 0 1px 0 rgba(255,255,255,0.02);
          position:relative; overflow:hidden; backdrop-filter:blur(20px);
          animation:cardFadeIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .reg-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg,transparent,rgba(232,168,56,0.5),transparent);
        }
        .reg-submit {
          width:100%; padding:14px; border-radius:12px;
          background:linear-gradient(135deg,#E8A838,#D4922A);
          color:#1B2A4A; font-size:15px; font-weight:800; border:none;
          cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:all 0.3s cubic-bezier(0.16,1,0.3,1);
          box-shadow:0 6px 20px rgba(232,168,56,0.3);
          display:flex; align-items:center; justify-content:center;
          gap:8px; position:relative; overflow:hidden; letter-spacing:0.3px;
        }
        .reg-submit:hover:not(:disabled) {
          transform:translateY(-2px);
          box-shadow:0 10px 40px rgba(232,168,56,0.45),0 0 20px rgba(232,168,56,0.15);
        }
        .reg-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .reg-link {
          color:#E8A838; text-decoration:none; font-weight:600; transition:all 0.2s;
        }
        .reg-link:hover { color:#F0C060; }
        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        input::placeholder { color:rgba(255,255,255,0.2); }
        select option { background:#152036; color:#F5F5F5; }
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
        @media (max-width:640px) { .two-col { grid-template-columns:1fr; } }
        @media (max-width:480px) { .reg-card { padding:28px 20px; } .reg-root { padding:24px 12px; } }
      `}</style>

      <div className="reg-root">
        <AnimatedAuthBackground />

        <div style={{ width:'100%', maxWidth:'540px', position:'relative', zIndex:1 }}>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
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

          {/* Progress indicators */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'24px' }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{
                  width:'32px', height:'32px', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'12px', fontWeight:700,
                  background: curIdx > i
                    ? 'rgba(42,157,143,0.8)'
                    : curIdx === i
                      ? 'linear-gradient(135deg,#E8A838,#D4922A)'
                      : 'rgba(27,42,74,0.6)',
                  color: curIdx >= i ? '#fff' : 'rgba(255,255,255,0.3)',
                  boxShadow: curIdx === i
                    ? '0 0 16px rgba(232,168,56,0.4)'
                    : curIdx > i ? '0 0 12px rgba(42,157,143,0.3)' : 'none',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition:'all 0.5s',
                }}>
                  {curIdx > i ? '✓' : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    width:'36px', height:'2px', borderRadius:'2px',
                    background: curIdx > i ? 'rgba(42,157,143,0.6)' : 'rgba(27,42,74,0.4)',
                    transition:'all 0.5s',
                  }} />
                )}
              </div>
            ))}
          </div>

          <div className="reg-card">

            {/* ── STEP 1: FORM ── */}
            {step === 'form' && (
              <div className="step-content">
                <h1 style={{
                  fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'24px',
                  color:'#FFFFFF', textAlign:'center', marginBottom:'4px',
                }}>Create Your Account</h1>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'14px', textAlign:'center', marginBottom:'28px' }}>
                  Join thousands of LDCE aspirants
                </p>

                <form onSubmit={handleRegister}>
                  <div className="input-group" style={{ marginBottom:'14px', animationDelay:'0.05s' }}>
                    <label style={{ display:'block', fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                      Full Name <span style={{ color:'#E8A838' }}>*</span>
                    </label>
                    <input
                      type="text" placeholder="Your full name"
                      value={form.fullName} required
                      onChange={e => update('fullName', e.target.value)}
                      onFocus={() => setFocused('fullName')}
                      onBlur={() => setFocused(null)}
                      style={inputStyle('fullName')}
                    />
                  </div>

                  <div className="two-col input-group" style={{ marginBottom:'14px', animationDelay:'0.1s' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                        Email <span style={{ color:'#E8A838' }}>*</span>
                      </label>
                      <input
                        type="email" placeholder="your@email.com"
                        value={form.email} required
                        onChange={e => update('email', e.target.value)}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused(null)}
                        style={inputStyle('email')}
                      />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                        Mobile <span style={{ color:'#E8A838' }}>*</span>
                      </label>
                      <input
                        type="tel" placeholder="10-digit number"
                        value={form.mobile} required maxLength={10}
                        onChange={e => update('mobile', e.target.value)}
                        onFocus={() => setFocused('mobile')}
                        onBlur={() => setFocused(null)}
                        style={inputStyle('mobile')}
                      />
                    </div>
                  </div>

                  <div className="two-col input-group" style={{ marginBottom:'20px', animationDelay:'0.15s' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                        Password <span style={{ color:'#E8A838' }}>*</span>
                      </label>
                      <input
                        type="password" placeholder="Min 8 chars"
                        value={form.password} required
                        onChange={e => update('password', e.target.value)}
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused(null)}
                        style={inputStyle('password')}
                      />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                        Confirm <span style={{ color:'#E8A838' }}>*</span>
                      </label>
                      <input
                        type="password" placeholder="Repeat password"
                        value={form.confirmPassword} required
                        onChange={e => update('confirmPassword', e.target.value)}
                        onFocus={() => setFocused('confirmPass')}
                        onBlur={() => setFocused(null)}
                        style={inputStyle('confirmPass')}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="input-group" style={{
                    borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'16px',
                    marginBottom:'20px', animationDelay:'0.2s',
                  }}>
                    <p style={{ fontSize:'10px', color:'#E8A838', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'12px' }}>
                      Address (Optional)
                    </p>
                    <input
                      type="text" placeholder="Address Line"
                      value={form.address.line}
                      onChange={e => updateAddress('line', e.target.value)}
                      onFocus={() => setFocused('line')}
                      onBlur={() => setFocused(null)}
                      style={{ ...inputStyle('line'), marginBottom:'10px' }}
                    />
                    <div className="two-col" style={{ marginBottom:'10px' }}>
                      <input
                        type="text" placeholder="City"
                        value={form.address.city}
                        onChange={e => updateAddress('city', e.target.value)}
                        onFocus={() => setFocused('city')}
                        onBlur={() => setFocused(null)}
                        style={inputStyle('city')}
                      />
                      <input
                        type="text" placeholder="Pincode" maxLength={6}
                        value={form.address.pincode}
                        onChange={e => updateAddress('pincode', e.target.value)}
                        onFocus={() => setFocused('pincode')}
                        onBlur={() => setFocused(null)}
                        style={inputStyle('pincode')}
                      />
                    </div>
                    <select
                      value={form.address.state}
                      onChange={e => updateAddress('state', e.target.value)}
                      onFocus={() => setFocused('state')}
                      onBlur={() => setFocused(null)}
                      style={inputStyle('state')}
                    >
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <button type="submit" disabled={loading} className="reg-submit">
                    {loading ? (
                      <>
                        <svg style={{ width:'16px', height:'16px', animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Creating account…
                      </>
                    ) : 'Create Account →'}
                  </button>
                </form>

                <p style={{ textAlign:'center', fontSize:'14px', color:'rgba(255,255,255,0.35)', marginTop:'24px' }}>
                  Already have an account?{' '}
                  <Link href="/auth/login" className="reg-link">Sign In</Link>
                </p>
              </div>
            )}

            {/* ── STEP 2: EMAIL OTP ── */}
            {step === 'email-otp' && (
              <div className="step-content" style={{ textAlign:'center' }}>
                <div style={{
                  width:'60px', height:'60px', borderRadius:'50%',
                  background:'rgba(232,168,56,0.08)', border:'1px solid rgba(232,168,56,0.15)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'28px', margin:'0 auto 14px',
                  boxShadow:'0 0 30px rgba(232,168,56,0.1)', animation:'float 3s ease infinite',
                }}>📧</div>

                <h2 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'24px', color:'#FFFFFF', marginBottom:'6px' }}>
                  Check Your Email
                </h2>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'14px', marginBottom:'4px' }}>
                  We sent a 6-digit OTP to
                </p>
                <p style={{ color:'#E8A838', fontSize:'15px', fontWeight:700, marginBottom:'24px' }}>
                  {form.email}
                </p>

                <div style={{ marginBottom:'24px' }}>
                  <OTPInput length={6} value={otp} onChange={setOtp} disabled={loading} />
                </div>

                <button
                  onClick={verifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="reg-submit"
                  style={{ opacity: otp.length !== 6 ? 0.6 : 1 }}
                >
                  {loading ? 'Verifying…' : 'Verify & Continue →'}
                </button>

                <div style={{ marginTop:'16px', display:'flex', justifyContent:'center', gap:'16px' }}>
                  <button
                    onClick={resendOTP}
                    disabled={loading}
                    style={{
                      background:'none', border:'none', color:'#E8A838',
                      fontSize:'13px', fontWeight:600, cursor:'pointer',
                      fontFamily:'DM Sans,sans-serif', opacity: loading ? 0.5 : 1,
                    }}
                  >
                    🔄 Resend OTP
                  </button>
                  <button
                    onClick={() => { setStep('form'); setOtp('') }}
                    style={{
                      background:'none', border:'none', color:'rgba(255,255,255,0.35)',
                      fontSize:'13px', cursor:'pointer', fontFamily:'DM Sans,sans-serif',
                    }}
                  >
                    ← Change Email
                  </button>
                </div>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {step === 'success' && (
              <div className="step-content" style={{ textAlign:'center', padding:'24px 0' }}>
                <div style={{
                  width:'80px', height:'80px', borderRadius:'50%',
                  background:'rgba(42,157,143,0.12)', border:'1px solid rgba(42,157,143,0.25)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'40px', margin:'0 auto 20px',
                  animation:'float 3s ease infinite', boxShadow:'0 0 40px rgba(42,157,143,0.15)',
                }}>🎉</div>
                <h2 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'24px', color:'#FFFFFF', marginBottom:'8px' }}>
                  You&apos;re Registered!
                </h2>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'15px', marginBottom:'28px' }}>
                  Your account has been verified. Start your LDCE journey now!
                </p>
                <button onClick={() => router.push('/auth/login')} className="reg-submit">
                  Sign In to Continue →
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}