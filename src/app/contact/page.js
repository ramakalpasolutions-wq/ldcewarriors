// src/app/contact/page.js
'use client'
import { useState, memo } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

const t = {
  navy: '#1B2A4A', navyLight: '#243656',
  gold: '#E8A838', goldDark: '#D4922A',
  teal: '#2A9D8F',
  bg: '#F5F3EF', card: '#FFFFFF',
  border: '#E5E7EB', text: '#1A1D23',
  muted: '#6B7280', faint: '#9CA3AF',
}

const GOOGLE_MAPS_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15296.687557761139!2d80.53627085016531!3d16.567853346977373!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a35ef0835823063%3A0x8667960e6410e041!2sSanjana%26Srujana%20Heights!5e0!3m2!1sen!2sin!4v1777024674407!5m2!1sen!2sin" width="400" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade'

// ── Memoized Map — prevents iframe reload on parent state changes ──
const ContactMap = memo(function ContactMap() {
  return (
    <div className="footer-map-wrap" style={{
      position: 'relative', borderRadius: '20px',
      overflow: 'hidden',
      border: '1px solid rgba(232, 168, 56, 0.15)',
    }}>
      <div className="footer-map-overlay" style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: 'rgba(27, 42, 74, 0.06)',
        pointerEvents: 'none',
        transition: 'opacity 0.35s ease',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, transparent, ${t.gold}, transparent)`,
        zIndex: 3, pointerEvents: 'none',
      }} />
      <iframe
        src={GOOGLE_MAPS_EMBED_URL}
        width="100%" height="380"
        style={{
          border: 'none', display: 'block', width: '100%',
          filter: 'saturate(0.8) contrast(1.05)',
        }}
        allowFullScreen loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="LDCE Warriors Location"
      />
    </div>
  )
})

// ── Memoized Stats — no need to re-render ──
const ContactStats = memo(function ContactStats() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px',
    }}>
      {[
        { value: '< 24h', label: 'Response Time', icon: '⚡' },
        { value: '24/7', label: 'Email Support', icon: '✉️' },
        { value: '100%', label: 'Secure Payment', icon: '🔒' },
      ].map(stat => (
        <div key={stat.label} style={{
          padding: '18px 14px', borderRadius: '16px',
          background: `linear-gradient(135deg, ${t.navy}, ${t.navyLight})`,
          textAlign: 'center',
          border: '1px solid rgba(232, 168, 56, 0.08)',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '6px' }}>{stat.icon}</div>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '20px', fontWeight: 800,
            color: t.gold, lineHeight: 1,
          }}>{stat.value}</div>
          <div style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.45)',
            marginTop: '4px', fontWeight: 600,
          }}>{stat.label}</div>
        </div>
      ))}
    </div>
  )
})

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', subject: '', message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [hoveredCard, setHoveredCard] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
        toast.success('Message sent successfully!')
      } else {
        toast.error(data.error || 'Failed to send message')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  function inputStyle(field) {
    const focused = focusedField === field
    return {
      width: '100%',
      padding: '13px 16px',
      borderRadius: '12px',
      background: focused ? '#FFFFFF' : '#FAFAF8',
      border: focused ? `1.5px solid ${t.gold}` : `1px solid ${t.border}`,
      color: t.text,
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'DM Sans, sans-serif',
      transition: 'all 0.25s ease',
      boxShadow: focused ? '0 0 0 3px rgba(232, 168, 56, 0.12)' : 'none',
    }
  }

  const contactItems = [
    {
      icon: '📧', label: 'Email Us',
      value: ' ldcewarriors@gmail.com', sub: 'Response within 24 hours',
      href: 'mailto: ldcewarriors@gmail.com',
    },
    {
      icon: '📞', label: 'Call Us',
      value: '+91 91542 42141', sub: 'Mon–Sat, 9am–6pm IST',
      href: 'tel:+919912986746',
    },
    {
      icon: '💬', label: 'WhatsApp',
      value: 'Chat with us', sub: 'Quick replies on WhatsApp',
      href: 'https://wa.me/+919912986746',
    },
    {
      icon: '📍', label: 'Location',
      value: 'NTR District, AP', sub: 'Andhra Pradesh, India',
      href: null,
    },
  ]

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatSoft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .contact-root { min-height: 100vh; background: ${t.bg}; }
        .contact-container {
          max-width: 1200px; margin: 0 auto;
          padding: 110px 24px 40px;
        }
        .contact-main-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 32px;
          align-items: start;
        }

        .footer-map-wrap:hover .footer-map-overlay {
          opacity: 0 !important;
        }

        input::placeholder, textarea::placeholder { color: ${t.faint}; }

        @media (max-width: 1024px) {
          .contact-main-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .contact-container { padding: 90px 16px 40px; }
          .form-two-col { grid-template-columns: 1fr !important; }
          .contact-info-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 400px) {
          .contact-info-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="contact-root">
        <Navbar />

        <div className="contact-container">

          {/* ── Page Header ── */}
          <div style={{
            textAlign: 'center', marginBottom: '52px',
            animation: 'fadeInUp 0.6s ease both',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', fontWeight: 700, color: t.navy,
              background: 'rgba(27, 42, 74, 0.06)',
              border: '1px solid rgba(27, 42, 74, 0.1)',
              padding: '5px 14px', borderRadius: '999px',
              textTransform: 'uppercase', letterSpacing: '1.2px',
              marginBottom: '16px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.gold }} />
              Get In Touch
            </span>

            <h1 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 800,
              fontSize: 'clamp(30px, 5vw, 48px)', color: t.text,
              lineHeight: 1.15, marginBottom: '14px', letterSpacing: '-1px',
            }}>
              We&apos;re Here to{' '}
              <span style={{
                background: `linear-gradient(135deg, ${t.gold}, ${t.goldDark})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Help You</span>
            </h1>

            <p style={{
              color: t.muted, fontSize: '15px', lineHeight: 1.7,
              maxWidth: '500px', margin: '0 auto',
            }}>
              Have a question about our courses, subscription, or content?
              Reach out and our team will respond within 24 hours.
            </p>
          </div>

          {/* ── Contact Info Cards ── */}
          <div className="contact-info-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
            marginBottom: '40px',
            animation: 'fadeInUp 0.6s ease 0.1s both',
          }}>
            {contactItems.map((item, i) => {
              const Tag = item.href ? 'a' : 'div'
              return (
                <Tag
                  key={item.label}
                  href={item.href || undefined}
                  target={item.href?.startsWith('http') ? '_blank' : undefined}
                  rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  onMouseEnter={() => setHoveredCard(i)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', textAlign: 'center',
                    padding: '24px 16px', borderRadius: '18px',
                    background: t.card,
                    border: hoveredCard === i
                      ? '1px solid rgba(232, 168, 56, 0.3)'
                      : `1px solid ${t.border}`,
                    transition: 'all 0.3s ease',
                    transform: hoveredCard === i ? 'translateY(-6px)' : 'translateY(0)',
                    boxShadow: hoveredCard === i
                      ? '0 16px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(232, 168, 56, 0.08)'
                      : '0 2px 8px rgba(0,0,0,0.03)',
                    textDecoration: 'none',
                    cursor: item.href ? 'pointer' : 'default',
                  }}
                >
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '16px',
                    background: hoveredCard === i
                      ? `linear-gradient(135deg, ${t.navy}, ${t.navyLight})`
                      : 'rgba(27, 42, 74, 0.05)',
                    border: `1px solid ${hoveredCard === i ? 'transparent' : 'rgba(27, 42, 74, 0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', marginBottom: '14px',
                    transition: 'all 0.3s ease',
                    animation: hoveredCard === i ? 'floatSoft 2s ease infinite' : 'none',
                  }}>
                    {item.icon}
                  </div>
                  <p style={{
                    fontSize: '10px', fontWeight: 700,
                    color: t.gold, textTransform: 'uppercase',
                    letterSpacing: '1px', marginBottom: '6px',
                  }}>{item.label}</p>
                  <p style={{
                    fontSize: '14px', fontWeight: 600,
                    color: hoveredCard === i ? t.navy : t.text,
                    marginBottom: '4px', transition: 'color 0.2s ease',
                  }}>{item.value}</p>
                  <p style={{ fontSize: '11px', color: t.faint }}>{item.sub}</p>
                </Tag>
              )
            })}
          </div>

          {/* ── Main Grid: Form + Map ── */}
          <div className="contact-main-grid">

            {/* ── Left: Contact Form ── */}
            <div style={{
              padding: '32px', borderRadius: '24px',
              background: t.card, border: `1px solid ${t.border}`,
              boxShadow: '0 8px 40px rgba(0,0,0,0.04)',
              position: 'relative', overflow: 'hidden',
              animation: 'fadeInUp 0.6s ease 0.2s both',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: `linear-gradient(90deg, ${t.navy}, ${t.gold}, ${t.navy})`,
              }} />
              <div style={{
                position: 'absolute', top: '-40px', right: '-40px',
                width: '150px', height: '150px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(232, 168, 56, 0.05) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              {submitted ? (
                <div style={{
                  textAlign: 'center', padding: '40px 0',
                  animation: 'fadeInUp 0.5s ease',
                }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'rgba(42, 157, 143, 0.1)',
                    border: '2px solid rgba(42, 157, 143, 0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '38px', margin: '0 auto 20px',
                    animation: 'floatSoft 3s ease infinite',
                  }}>✅</div>
                  <h3 style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '24px', fontWeight: 800,
                    color: t.text, marginBottom: '10px',
                  }}>Message Sent!</h3>
                  <p style={{
                    color: t.muted, fontSize: '14px', lineHeight: 1.6,
                    maxWidth: '300px', margin: '0 auto 28px',
                  }}>
                    Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                  <button onClick={() => {
                    setSubmitted(false)
                    setForm({ name: '', email: '', mobile: '', subject: '', message: '' })
                  }} style={{
                    padding: '11px 28px', borderRadius: '12px',
                    background: 'rgba(27, 42, 74, 0.06)',
                    border: '1px solid rgba(27, 42, 74, 0.12)',
                    color: t.navy, fontSize: '14px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{
                      fontFamily: 'Playfair Display, serif',
                      fontSize: '20px', fontWeight: 800,
                      color: t.text, marginBottom: '4px',
                    }}>Send us a Message</h2>
                    <p style={{ color: t.faint, fontSize: '12px' }}>
                      Fields marked with * are required
                    </p>
                  </div>

                  <div className="form-two-col" style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '14px', marginBottom: '14px',
                  }}>
                    <div>
                      <label style={{
                        display: 'block', fontSize: '11px', color: t.navy,
                        marginBottom: '6px', fontWeight: 700, letterSpacing: '0.3px',
                      }}>
                        Full Name <span style={{ color: t.gold }}>*</span>
                      </label>
                      <input type="text" placeholder="Your Name"
                        value={form.name} required
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        style={inputStyle('name')} />
                    </div>
                    <div>
                      <label style={{
                        display: 'block', fontSize: '11px', color: t.navy,
                        marginBottom: '6px', fontWeight: 700, letterSpacing: '0.3px',
                      }}>
                        Email <span style={{ color: t.gold }}>*</span>
                      </label>
                      <input type="email" placeholder="your@email.com"
                        value={form.email} required
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        style={inputStyle('email')} />
                    </div>
                  </div>

                  <div className="form-two-col" style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '14px', marginBottom: '14px',
                  }}>
                    <div>
                      <label style={{
                        display: 'block', fontSize: '11px', color: t.navy,
                        marginBottom: '6px', fontWeight: 700,
                      }}>Mobile</label>
                      <input type="tel" placeholder="10-digit mobile"
                        value={form.mobile}
                        onChange={e => setForm({ ...form, mobile: e.target.value })}
                        onFocus={() => setFocusedField('mobile')}
                        onBlur={() => setFocusedField(null)}
                        style={inputStyle('mobile')} />
                    </div>
                    <div>
                      <label style={{
                        display: 'block', fontSize: '11px', color: t.navy,
                        marginBottom: '6px', fontWeight: 700,
                      }}>Subject</label>
                      <input type="text" placeholder="What's this about?"
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        onFocus={() => setFocusedField('subject')}
                        onBlur={() => setFocusedField(null)}
                        style={inputStyle('subject')} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block', fontSize: '11px', color: t.navy,
                      marginBottom: '6px', fontWeight: 700,
                    }}>
                      Message <span style={{ color: t.gold }}>*</span>
                    </label>
                    <textarea placeholder="Tell us how we can help..."
                      value={form.message} rows={5} required
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...inputStyle('message'), resize: 'vertical', minHeight: '120px' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <span style={{
                        fontSize: '10px',
                        color: form.message.length > 20 ? t.teal : t.faint,
                      }}>{form.message.length} chars</span>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '14px', borderRadius: '13px',
                    background: loading ? t.navy : `linear-gradient(135deg, ${t.navy}, ${t.navyLight})`,
                    color: '#fff', fontSize: '15px', fontWeight: 700,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.25s ease',
                    boxShadow: loading ? 'none' : '0 8px 25px rgba(27, 42, 74, 0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    opacity: loading ? 0.8 : 1,
                  }}>
                    {loading ? (
                      <>
                        <svg style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}
                          fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </>
                    )}
                  </button>

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '16px', marginTop: '14px', flexWrap: 'wrap',
                  }}>
                    {['🔒 Secure', '✉️ No Spam', '⚡ Fast Response'].map((badge, i) => (
                      <span key={i} style={{ fontSize: '11px', color: t.faint }}>{badge}</span>
                    ))}
                  </div>
                </form>
              )}
            </div>

            {/* ── Right: Map + Stats (memoized) ── */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '20px',
              animation: 'fadeInUp 0.6s ease 0.3s both',
            }}>
              <ContactMap />

              <a href="https://maps.google.com/?q=Vijayawada,+Andhra+Pradesh"
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', fontWeight: 600,
                  color: t.gold, textDecoration: 'none',
                  transition: 'color 0.2s',
                  alignSelf: 'flex-start',
                }}
                onMouseEnter={e => e.currentTarget.style.color = t.goldDark}
                onMouseLeave={e => e.currentTarget.style.color = t.gold}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in Google Maps
              </a>

              <ContactStats />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}