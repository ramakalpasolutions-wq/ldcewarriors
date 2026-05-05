// src/app/premium/page.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const t = {
  navy:      '#1B2A4A',
  navyLight: '#243656',
  navyDark:  '#12203A',
  gold:      '#E8A838',
  goldDark:  '#D4922A',
  goldLight: '#F0C060',
  teal:      '#2A9D8F',
  bg:        '#F5F3EF',
  card:      '#FFFFFF',
  border:    '#E5E7EB',
  text:      '#1A1D23',
  muted:     '#6B7280',
  faint:     '#9CA3AF',
}

const TOPIC_ICONS = {
  'office procedure': '📋', 'service rules':   '⚖️',
  'financial rules':  '💰', 'acts & statutes': '📜',
  'general knowledge':'🌐', 'english grammar': '✍️',
  'current affairs':  '📰', 'model q&a':       '❓',
}

const COURSE_TOPICS = [
  { icon: '🚃', label: 'Wagon' },
  { icon: '🚄', label: 'LHB (Linke Hofmann Busch coaches)' },
  { icon: '🏭', label: 'ICf (Integrated Coach Factory)' },
  { icon: '🚂', label: 'Diesel Locomotives' },
  { icon: '📋', label: 'Establishment Rules' },
  { icon: '💰', label: 'Financial Rules' },
  { icon: '🗄️', label: 'Stores Management' },
  { icon: '🌐', label: 'General Awareness' },
  { icon: '🧠', label: 'Aptitude & Reasoning' },
]

/* ── Sub-components ── */
function FeatureCard({ icon, title, desc }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: '16px', padding: '22px',
        borderRadius: '16px', background: t.card,
        border: hovered ? '1px solid rgba(232,168,56,0.3)' : `1px solid ${t.border}`,
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 30px rgba(0,0,0,0.07)'
          : '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{
        width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
        background: hovered
          ? `linear-gradient(135deg,${t.navy},${t.navyLight})`
          : 'rgba(27,42,74,0.05)',
        border: `1px solid ${hovered ? 'transparent' : 'rgba(27,42,74,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', transition: 'all 0.3s ease',
      }}>
        {icon}
      </div>
      <div>
        <h4 style={{
          color: hovered ? t.navy : t.text, fontWeight: 700,
          fontSize: '14px', marginBottom: '6px', transition: 'color 0.2s',
        }}>
          {title}
        </h4>
        <p style={{ color: t.faint, fontSize: '13px', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  )
}

function TopicPill({ topic }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px 16px', borderRadius: '14px', textAlign: 'center',
        background: hovered ? `linear-gradient(135deg,${t.navy},${t.navyLight})` : t.card,
        border: hovered ? `1px solid ${t.navy}` : `1px solid ${t.border}`,
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 30px rgba(27,42,74,0.2)'
          : '0 2px 8px rgba(0,0,0,0.03)',
        cursor: 'default',
      }}
    >
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>
        {TOPIC_ICONS[topic.name?.toLowerCase()] || '📚'}
      </div>
      <p style={{
        color: hovered ? '#FFFFFF' : t.text,
        fontSize: '13px', fontWeight: 600, marginBottom: '6px',
        transition: 'color 0.2s',
      }}>
        {topic.name}
      </p>
      <p style={{ color: t.gold, fontSize: '11px', fontWeight: 700 }}>
        {topic.videoCount || 0} Videos
      </p>
    </div>
  )
}

function SkeletonPill() {
  return (
    <div style={{
      padding: '20px 16px', borderRadius: '14px',
      textAlign: 'center', background: t.card,
      border: `1px solid ${t.border}`,
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: '#F3F4F6', margin: '0 auto 10px',
        animation: 'pulse 1.5s infinite',
      }} />
      <div style={{
        height: '12px', borderRadius: '6px',
        background: '#F3F4F6', marginBottom: '6px',
        animation: 'pulse 1.5s infinite',
      }} />
      <div style={{
        height: '10px', borderRadius: '6px',
        background: '#E5E7EB', width: '60%',
        margin: '0 auto', animation: 'pulse 1.5s infinite',
      }} />
    </div>
  )
}

/* ── Main Page ── */
export default function PremiumPage() {
  const [topics,        setTopics]        = useState([])
  const [topicsLoading, setTopicsLoading] = useState(true)

  // Coupon state
  const [couponCode,    setCouponCode]    = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponFocused, setCouponFocused] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [discount,      setDiscount]      = useState(0)

  // Pricing state
  const [basePrice,    setBasePrice]    = useState(999)
  const [subMonths,    setSubMonths]    = useState(4)
  const [finalPrice,   setFinalPrice]   = useState(999)
  const [priceLoading, setPriceLoading] = useState(true)

  // Payment / auth state
  const [loading,      setLoading]      = useState(false)
  const [isLoggedIn,   setIsLoggedIn]   = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const router = useRouter()

  /* ── On mount ── */
  useEffect(() => {
    const user = localStorage.getItem('ldce_user')
    setIsLoggedIn(!!user)

    if (user) {
      fetch('/api/user/profile')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.user?.subscription) setIsSubscribed(true)
        })
        .catch(() => {})
    }

    // Load Razorpay script
    if (!document.querySelector('script[src*="checkout.razorpay"]')) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
    }

    // Load live pricing
    async function loadPrice() {
      setPriceLoading(true)
      try {
        const res  = await fetch('/api/admin/settings')
        const data = await res.json()
        if (data.success) {
          const p = data.settings.subscriptionPrice  ?? 999
          const m = data.settings.subscriptionMonths ?? 4
          setBasePrice(p)
          setFinalPrice(p)
          setSubMonths(m)
        }
      } catch {
        setBasePrice(999); setFinalPrice(999); setSubMonths(4)
      }
      setPriceLoading(false)
    }
    loadPrice()

    // Load topics
    async function loadTopics() {
      try {
        const res  = await fetch('/api/admin/topics')
        const data = await res.json()
        if (data.success) setTopics(data.topics || [])
      } catch {}
      setTopicsLoading(false)
    }
    loadTopics()
  }, [])

  /* ══════════════════════════════════════════════════════
     APPLY COUPON — checkOnly mode, NO order created,
     NO usedCount incremented
  ══════════════════════════════════════════════════════ */
  async function applyCoupon() {
    if (!couponCode.trim()) return

    if (!isLoggedIn) {
      toast('Please login to apply a coupon', { icon: '🔐' })
      router.push('/auth/login?redirect=/premium')
      return
    }

    setCouponLoading(true)
    try {
      const res = await fetch('/api/subscription/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        // checkOnly: true → API validates coupon only, no side effects
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          checkOnly:  true,
        }),
      })
      const data = await res.json()

      if (data.success) {
        // Store the validated discount values in state
        setDiscount(data.discountAmount)
        setFinalPrice(data.amount)
        setCouponApplied(true)
        toast.success(`🎉 Coupon applied! You save ₹${data.discountAmount}`)
      } else {
        toast.error(data.error || 'Invalid coupon')
        // Reset if previously applied
        setCouponApplied(false)
        setDiscount(0)
        setFinalPrice(basePrice)
      }
    } catch {
      toast.error('Failed to apply coupon. Please try again.')
    }
    setCouponLoading(false)
  }

  /* ── Remove coupon ── */
  function removeCoupon() {
    setCouponCode('')
    setCouponApplied(false)
    setDiscount(0)
    setFinalPrice(basePrice)
    toast('Coupon removed', { icon: '✕' })
  }

  /* ══════════════════════════════════════════════════════
     SUBSCRIBE — creates real Razorpay order
     Coupon validated again server-side (double-check)
  ══════════════════════════════════════════════════════ */
  async function handleSubscribe() {
    if (!isLoggedIn) {
      toast('Please login to subscribe', { icon: '🔐' })
      router.push('/auth/login?redirect=/premium')
      return
    }

    setLoading(true)
    try {
      // Create real order — passes coupon only if user applied it
      const res = await fetch('/api/subscription/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: couponApplied ? couponCode.trim() : '',
          checkOnly:  false,   // explicit — real order
        }),
      })
      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || 'Failed to create order')
        // If coupon suddenly became invalid, reset it
        if (
          couponApplied && (
            data.error?.toLowerCase().includes('coupon') ||
            data.error?.toLowerCase().includes('limit')
          )
        ) {
          setCouponApplied(false)
          setDiscount(0)
          setFinalPrice(basePrice)
          setCouponCode('')
          toast.error('Coupon is no longer valid. Please try without it.')
        }
        setLoading(false)
        return
      }

      const userObj = JSON.parse(localStorage.getItem('ldce_user') || '{}')

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      data.order.amount,
        currency:    'INR',
        name:        'LDCE Warriors',
        description: `${subMonths}-Month Premium Subscription`,
        order_id:    data.order.id,

        handler: async (response) => {
          try {
            const verifyRes  = await fetch('/api/subscription/verify-payment', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify(response),
            })
            const verifyData = await verifyRes.json()

            if (verifyData.success) {
              localStorage.setItem(
                'ldce_subscription',
                JSON.stringify(verifyData.subscription),
              )
              setIsSubscribed(true)
              toast.success('🎉 Premium access activated!')
              router.push('/classes')
            } else {
              toast.error(verifyData.error || 'Payment verification failed')
            }
          } catch {
            toast.error('Something went wrong after payment. Contact support.')
          }
        },

        prefill: {
          name:  userObj.fullName || '',
          email: userObj.email    || '',
        },
        theme: { color: t.navy },
        modal: {
          ondismiss: () => {
            setLoading(false)
            toast('Payment cancelled', { icon: 'ℹ️' })
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      console.error('Subscribe error:', err)
      toast.error('Failed to initiate payment. Please try again.')
      setLoading(false)
    }
  }

  /* ── Dynamic features ── */
  const FEATURES = [
    { icon: '🎥', title: 'Premium Video Lectures',
      desc: 'High-quality topic-wise video content by experts' },
    { icon: '📋', title: 'Full Topic-Wise Courses',
      desc: 'Structured learning across all LDCE topics' },
    { icon: '📱', title: 'Access on All Devices',
      desc: 'Desktop, tablet, and mobile — learn anywhere, anytime' },
    { icon: '🔄', title: `${subMonths}-Month Validity`,
      desc: `Full access for ${subMonths} months from subscription date` },
    { icon: '▶️', title: '2 Plays Per Video',
      desc: 'Each premium video can be played up to 2 times' },
    { icon: '🎟️', title: 'Coupon Discounts',
      desc: 'Apply coupon codes for exclusive discounts' },
  ]

  /* ═════════════════════════════════════════════
     RENDER
  ═════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .premium-root { min-height: 100vh; background: ${t.bg}; }
        .premium-container {
          max-width: 1280px; margin: 0 auto;
          padding: 110px 24px 90px;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 16px;
        }
        .topics-pill-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 14px;
        }
        .prem-section { margin-bottom: 88px; }
        .price-skel {
          display: inline-block;
          border-radius: 12px;
          background: linear-gradient(90deg,
            rgba(255,255,255,0.08) 25%,
            rgba(255,255,255,0.15) 50%,
            rgba(255,255,255,0.08) 75%
          );
          background-size: 200% 100%;
          animation: shimmerWhite 1.4s infinite;
        }
        .coupon-remove {
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.4);
          background: none; border: none;
          cursor: pointer; padding: 0 4px;
          transition: color 0.2s; font-family: inherit;
        }
        .coupon-remove:hover { color: #ef4444; }

        @keyframes shimmerWhite {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeInUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmerGold {
          0%   { background-position:-200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pricePop {
          0%  { transform:scale(0.9); opacity:0; }
          60% { transform:scale(1.05); }
          100%{ transform:scale(1); opacity:1; }
        }

        @media (max-width: 1024px) {
          .feature-grid     { grid-template-columns: repeat(2,1fr); }
          .topics-pill-grid { grid-template-columns: repeat(3,1fr); }
        }
        @media (max-width: 640px) {
          .feature-grid       { grid-template-columns: 1fr; }
          .topics-pill-grid   { grid-template-columns: repeat(2,1fr); }
          .premium-container  { padding: 90px 16px 60px; }
          .sub-card-inner     { padding: 24px 20px !important; }
          .prem-section       { margin-bottom: 60px; }
        }
      `}</style>

      <div className="premium-root">
        <Navbar />

        <div className="premium-container">

          {/* ── Hero ── */}
          <div style={{
            textAlign: 'center', marginBottom: '64px',
            animation: 'fadeInUp 0.6s ease both',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontSize: '11px', fontWeight: 700,
              background: `linear-gradient(135deg,${t.gold},${t.goldDark})`,
              color: t.navyDark, padding: '6px 18px',
              borderRadius: '999px', textTransform: 'uppercase',
              letterSpacing: '1.5px', marginBottom: '22px',
              boxShadow: '0 4px 15px rgba(232,168,56,0.25)',
            }}>
              ⭐ Premium Access
            </span>

            <h1 style={{
              fontFamily: 'Playfair Display,serif',
              fontWeight: 800,
              fontSize: 'clamp(32px,5vw,58px)',
              color: t.text, lineHeight: 1.1,
              marginBottom: '16px', letterSpacing: '-1px',
            }}>
              LDCE{' '}
              <span style={{
                background: `linear-gradient(135deg,${t.gold},${t.goldLight})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Warriors</span>
            </h1>

            <p style={{
              color: t.muted, fontSize: '17px',
              lineHeight: 1.7, maxWidth: '520px', margin: '0 auto',
            }}>
              Complete premium access to all topic-wise courses, expert video lectures,
              and structured preparation material.
            </p>
          </div>

          {/* ── Subscription Card ── */}
          <div style={{
            maxWidth: '520px', margin: '0 auto 88px',
            animation: 'fadeInUp 0.6s ease 0.15s both',
          }}>
            <div style={{
              borderRadius: '28px', overflow: 'hidden',
              background: `linear-gradient(160deg,${t.navy} 0%,${t.navyDark} 100%)`,
              border: '1px solid rgba(232,168,56,0.2)',
              boxShadow: '0 30px 60px rgba(27,42,74,0.25),0 0 0 1px rgba(232,168,56,0.1)',
              position: 'relative',
            }}>
              {/* Shimmer top bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: `linear-gradient(90deg,transparent,${t.gold},${t.goldLight},${t.gold},transparent)`,
                backgroundSize: '200% 100%',
                animation: 'shimmerGold 3s linear infinite',
              }} />
              {/* Orb */}
              <div style={{
                position: 'absolute', top: '-60px', right: '-60px',
                width: '220px', height: '220px', borderRadius: '50%',
                background: 'radial-gradient(circle,rgba(232,168,56,0.1) 0%,transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div className="sub-card-inner" style={{ padding: '40px' }}>
                {isSubscribed ? (
                  /* Already subscribed */
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
                    <h2 style={{
                      fontFamily: 'Playfair Display,serif',
                      fontSize: '28px', fontWeight: 800,
                      color: '#FFFFFF', marginBottom: '10px',
                    }}>You&apos;re Premium!</h2>
                    <p style={{
                      color: 'rgba(255,255,255,0.55)',
                      fontSize: '15px', marginBottom: '28px', lineHeight: 1.6,
                    }}>
                      You have active premium access. Enjoy all courses and expert lectures.
                    </p>
                    <button
                      onClick={() => router.push('/classes')}
                      style={{
                        width: '100%', padding: '15px', borderRadius: '14px',
                        background: `linear-gradient(135deg,${t.gold},${t.goldDark})`,
                        color: t.navyDark, fontSize: '16px', fontWeight: 800,
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '0 8px 25px rgba(232,168,56,0.3)',
                      }}
                    >Go to Classes →</button>
                  </div>
                ) : (
                  /* Subscribe form */
                  <div>
                    {/* Card header */}
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                      <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'rgba(232,168,56,0.12)',
                        border: '1px solid rgba(232,168,56,0.2)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '32px',
                        margin: '0 auto 16px',
                      }}>⭐</div>
                      <h2 style={{
                        fontFamily: 'Playfair Display,serif',
                        fontSize: '26px', fontWeight: 800,
                        color: '#FFFFFF', marginBottom: '4px',
                      }}>
                        {priceLoading ? 'Premium Plan' : `${subMonths}-Month Premium`}
                      </h2>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
                        Complete access • No recurring charges
                      </p>
                    </div>

                    {/* Price block */}
                    <div style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px', padding: '20px',
                      marginBottom: '20px', textAlign: 'center',
                    }}>
                      {priceLoading ? (
                        <div style={{
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: '8px',
                        }}>
                          <div className="price-skel" style={{ width: '140px', height: '60px' }} />
                          <div className="price-skel" style={{ width: '80px', height: '16px' }} />
                        </div>
                      ) : (
                        <>
                          {discount > 0 && (
                            <p style={{
                              color: 'rgba(255,255,255,0.35)',
                              textDecoration: 'line-through',
                              fontSize: '18px', marginBottom: '4px',
                            }}>₹{basePrice}</p>
                          )}
                          <div style={{
                            display: 'flex', alignItems: 'baseline',
                            justifyContent: 'center', gap: '8px',
                            animation: 'pricePop 0.4s ease both',
                          }}>
                            <span style={{
                              fontFamily: 'Times New Roman',
                              fontWeight: 800, fontSize: '60px',
                              background: `linear-gradient(135deg,${t.gold},${t.goldLight})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text', lineHeight: 1,
                            }}>₹{finalPrice}</span>
                            <span style={{
                              color: 'rgba(255,255,255,0.4)', fontSize: '14px',
                            }}>/ {subMonths} months</span>
                          </div>
                          <p style={{
                            color: 'rgba(255,255,255,0.3)',
                            fontSize: '12px', marginTop: '6px',
                          }}>
                            ≈ ₹{Math.round(finalPrice / subMonths)}/month
                          </p>
                          {discount > 0 && (
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              marginTop: '10px', padding: '4px 12px',
                              borderRadius: '999px',
                              background: 'rgba(42,157,143,0.15)',
                              border: '1px solid rgba(42,157,143,0.25)',
                            }}>
                              <span style={{
                                fontSize: '13px', color: '#4DD9CB', fontWeight: 600,
                              }}>🎉 You save ₹{discount}!</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Subscription Details */}
                    <div style={{
                      borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      overflow: 'hidden', marginBottom: '20px',
                    }}>
                      <div style={{
                        padding: '12px 16px',
                        background: 'rgba(232,168,56,0.08)',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <span style={{ fontSize: '14px' }}>📄</span>
                        <span style={{
                          fontSize: '11px', fontWeight: 700,
                          color: t.gold, letterSpacing: '1px',
                          textTransform: 'uppercase',
                        }}>Subscription Details</span>
                      </div>
                      <div style={{ padding: '14px 16px 4px', background: 'rgba(255,255,255,0.03)' }}>
                        {[
                          { icon: '📅', text: `Valid for ${priceLoading ? '—' : subMonths} months.` },
                          { icon: '▶️', text: 'Each video can be watched up to 2 times only.' },
                        ].map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start',
                            gap: '10px', marginBottom: '10px',
                          }}>
                            <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>
                              {item.icon}
                            </span>
                            <span style={{
                              fontSize: '13px', color: 'rgba(255,255,255,0.65)',
                              lineHeight: 1.5,
                            }}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.02)',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          marginBottom: '10px',
                        }}>
                          <span style={{ fontSize: '13px' }}>📚</span>
                          <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: 'rgba(255,255,255,0.5)',
                            letterSpacing: '0.8px', textTransform: 'uppercase',
                          }}>Course Coverage</span>
                        </div>
                        <p style={{
                          fontSize: '12px', color: 'rgba(255,255,255,0.4)',
                          marginBottom: '10px', lineHeight: 1.5,
                        }}>
                          This subject covers all topics, including:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          {COURSE_TOPICS.map((topic, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: '9px',
                            }}>
                              <span style={{
                                width: '20px', height: '20px', borderRadius: '6px',
                                background: 'rgba(232,168,56,0.1)',
                                border: '1px solid rgba(232,168,56,0.18)',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '11px', flexShrink: 0,
                              }}>{topic.icon}</span>
                              <span style={{
                                fontSize: '12px', color: 'rgba(255,255,255,0.6)',
                                lineHeight: 1.4,
                              }}>{topic.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      height: '1px', background: 'rgba(255,255,255,0.08)',
                      marginBottom: '20px',
                    }} />

                    {/* ── Coupon input ── */}
                    <div style={{ marginBottom: '16px' }}>
                      {!couponApplied ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Coupon code (optional)"
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            onFocus={() => setCouponFocused(true)}
                            onBlur={() => setCouponFocused(false)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); applyCoupon() }
                            }}
                            style={{
                              flex: 1, padding: '12px 16px',
                              borderRadius: '11px',
                              background: couponFocused
                                ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                              border: couponFocused
                                ? '1.5px solid rgba(232,168,56,0.4)'
                                : '1px solid rgba(255,255,255,0.1)',
                              color: '#FFFFFF', fontSize: '14px',
                              outline: 'none', fontFamily: 'inherit',
                              transition: 'all 0.2s',
                              letterSpacing: couponCode ? '1px' : '0',
                            }}
                          />
                          <button
                            onClick={applyCoupon}
                            disabled={couponLoading || !couponCode.trim()}
                            style={{
                              padding: '12px 16px', borderRadius: '11px',
                              background: 'rgba(232,168,56,0.15)',
                              border: '1px solid rgba(232,168,56,0.25)',
                              color: t.gold, fontSize: '13px', fontWeight: 700,
                              cursor: 'pointer', whiteSpace: 'nowrap',
                              fontFamily: 'inherit', transition: 'all 0.2s',
                              opacity: (couponLoading || !couponCode.trim()) ? 0.5 : 1,
                              display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                          >
                            {couponLoading ? (
                              <svg style={{
                                width: '14px', height: '14px',
                                animation: 'spin 1s linear infinite',
                              }} fill="none" viewBox="0 0 24 24">
                                <circle style={{ opacity:.25 }} cx="12" cy="12" r="10"
                                  stroke="currentColor" strokeWidth="4" />
                                <path style={{ opacity:.75 }} fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                            ) : 'Apply'}
                          </button>
                        </div>
                      ) : (
                        /* Applied state */
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '11px 16px', borderRadius: '11px',
                          background: 'rgba(42,157,143,0.12)',
                          border: '1px solid rgba(42,157,143,0.25)',
                        }}>
                          <span style={{ fontSize: '16px' }}>✅</span>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              color: '#4DD9CB', fontSize: '13px',
                              fontWeight: 700, marginBottom: '1px',
                            }}>{couponCode}</p>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                              Saving ₹{discount}
                            </p>
                          </div>
                          <button className="coupon-remove" onClick={removeCoupon}>
                            ✕ Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── Subscribe button ── */}
                    <button
                      onClick={handleSubscribe}
                      disabled={loading || priceLoading}
                      style={{
                        width: '100%', padding: '16px', borderRadius: '14px',
                        background: (loading || priceLoading)
                          ? 'rgba(232,168,56,0.5)'
                          : `linear-gradient(135deg,${t.gold},${t.goldDark})`,
                        color: t.navyDark, fontSize: '16px', fontWeight: 800,
                        border: 'none',
                        cursor: (loading || priceLoading) ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.25s',
                        boxShadow: (loading || priceLoading)
                          ? 'none' : '0 8px 30px rgba(232,168,56,0.3)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px',
                      }}
                      onMouseEnter={e => {
                        if (!loading && !priceLoading) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 12px 40px rgba(232,168,56,0.4)'
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(232,168,56,0.3)'
                      }}
                    >
                      {loading ? (
                        <>
                          <svg style={{
                            width: '18px', height: '18px',
                            animation: 'spin 1s linear infinite',
                          }} fill="none" viewBox="0 0 24 24">
                            <circle style={{ opacity:.25 }} cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4" />
                            <path style={{ opacity:.75 }} fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Processing…
                        </>
                      ) : priceLoading ? (
                        <>
                          <svg style={{
                            width: '16px', height: '16px',
                            animation: 'spin 1s linear infinite',
                          }} fill="none" viewBox="0 0 24 24">
                            <circle style={{ opacity:.25 }} cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4" />
                            <path style={{ opacity:.75 }} fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Loading price…
                        </>
                      ) : (
                        `⭐ Subscribe Now — ₹${finalPrice}`
                      )}
                    </button>

                    {/* Trust badges */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap',
                    }}>
                      {['🔒 Secure', '💳 Razorpay', '📱 UPI / Card'].map((badge, i) => (
                        <span key={i} style={{
                          fontSize: '11px', color: 'rgba(255,255,255,0.3)',
                          padding: '0 10px',
                          borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        }}>{badge}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Features Grid ── */}
          <div className="prem-section">
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', fontWeight: 700, color: t.navy,
                background: 'rgba(27,42,74,0.06)',
                border: '1px solid rgba(27,42,74,0.1)',
                padding: '5px 14px', borderRadius: '999px',
                textTransform: 'uppercase', letterSpacing: '1.2px',
                marginBottom: '14px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.gold }} />
                What&apos;s Included
              </span>
              <h2 style={{
                fontFamily: 'Playfair Display,serif', fontWeight: 800,
                fontSize: 'clamp(26px,4vw,40px)', color: t.text, letterSpacing: '-0.5px',
              }}>
                Everything in{' '}
                <span style={{
                  background: `linear-gradient(135deg,${t.gold},${t.goldDark})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>Premium</span>
              </h2>
            </div>
            <div className="feature-grid">
              {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
            </div>
          </div>

          {/* ── Topics Grid ── */}
          <div className="prem-section">
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', fontWeight: 700, color: t.navy,
                background: 'rgba(27,42,74,0.06)',
                border: '1px solid rgba(27,42,74,0.1)',
                padding: '5px 14px', borderRadius: '999px',
                textTransform: 'uppercase', letterSpacing: '1.2px',
                marginBottom: '14px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.gold }} />
                Course Content
              </span>
              <h2 style={{
                fontFamily: 'Playfair Display,serif', fontWeight: 800,
                fontSize: 'clamp(26px,4vw,40px)', color: t.text, letterSpacing: '-0.5px',
              }}>
                Topics{' '}
                <span style={{
                  background: `linear-gradient(135deg,${t.navy},${t.navyLight})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>Covered</span>
              </h2>
            </div>

            {topicsLoading ? (
              <div className="topics-pill-grid">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonPill key={i} />)}
              </div>
            ) : topics.length > 0 ? (
              <div className="topics-pill-grid">
                {topics.map(topic => <TopicPill key={topic._id} topic={topic} />)}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
                <p style={{ color: t.faint, fontSize: '15px' }}>
                  Topics are being prepared. Check back soon!
                </p>
              </div>
            )}
          </div>

          {/* ── Final CTA ── */}
          <div style={{
            borderRadius: '28px', overflow: 'hidden',
            background: `linear-gradient(135deg,${t.navy} 0%,${t.navyDark} 100%)`,
            border: '1px solid rgba(232,168,56,0.15)',
            padding: '56px 40px', textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `
                linear-gradient(rgba(232,168,56,0.05) 1px,transparent 1px),
                linear-gradient(90deg,rgba(232,168,56,0.05) 1px,transparent 1px)
              `,
              backgroundSize: '40px 40px', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: '-80px', right: '-80px',
              width: '300px', height: '300px', borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(232,168,56,0.08) 0%,transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🚀</div>
              <h3 style={{
                fontFamily: 'Playfair Display,serif', fontWeight: 800,
                fontSize: 'clamp(24px,4vw,36px)',
                color: '#FFFFFF', marginBottom: '12px', letterSpacing: '-0.5px',
              }}>
                Ready to get started?
              </h3>
              <p style={{
                color: 'rgba(255,255,255,0.5)', fontSize: '15px',
                lineHeight: 1.7, maxWidth: '400px',
                margin: '0 auto 32px',
              }}>
                Join thousands of aspirants already preparing with LDCE Warriors.
              </p>
              <div style={{
                display: 'flex', justifyContent: 'center',
                gap: '14px', flexWrap: 'wrap',
              }}>
                <button
                  onClick={handleSubscribe}
                  disabled={priceLoading}
                  style={{
                    padding: '14px 32px', borderRadius: '13px',
                    background: `linear-gradient(135deg,${t.gold},${t.goldDark})`,
                    color: t.navyDark, fontWeight: 800, fontSize: '15px',
                    border: 'none',
                    cursor: priceLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                    boxShadow: '0 8px 25px rgba(232,168,56,0.3)',
                    opacity: priceLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!priceLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 14px 35px rgba(232,168,56,0.4)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(232,168,56,0.3)'
                  }}
                >
                  ⭐ Subscribe Now — ₹{finalPrice}
                </button>
                <Link
                  href="/contact"
                  style={{
                    padding: '14px 32px', borderRadius: '13px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', fontWeight: 600,
                    fontSize: '15px', textDecoration: 'none',
                    transition: 'all 0.2s',
                    display: 'inline-flex', alignItems: 'center',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.color = '#FFFFFF'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                  }}
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>

        </div>

        <Footer />
      </div>
    </>
  )
}