// src/components/layout/Footer.js
'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Pacifico } from 'next/font/google'
const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
})

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/YOUR_PAGE',
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: '#4267B2',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/YOUR_HANDLE',
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    color: '#E1306C',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@YOUR_CHANNEL',
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    color: '#FF0000',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/+919912986746',
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25D366',
  },
]

const QUICK_LINKS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/classes', label: 'Classes', icon: '🎥' },
  { href: '/articles', label: 'Articles', icon: '📰' },
  { href: '/premium', label: 'Premium', icon: '⭐' },
  { href: '/contact', label: 'Contact', icon: '📩' },
  { href: '/profile', label: 'My Profile', icon: '👤' },
]

const CONTACT_INFO = [
  { icon: '📧', label: 'Email', value: ' ldcewarriors@gmail.com', href: 'mailto: ldcewarriors@gmail.com' },
  { icon: '📱', label: 'Phone', value: '+91 99129 86746', href: 'tel:+919912986746' },
  { icon: '🕐', label: 'Support Hours', value: 'Mon–Sat, 9am–6pm IST', href: null },
  { icon: '📍', label: 'Location', value: 'NTR District,AP-521241', href: null },
]

// ── REPLACE THIS WITH YOUR ACTUAL GOOGLE MAPS EMBED URL ──────────
// How to get it:
// 1. Go to Google Maps → search your location
// 2. Click Share → Embed a map → Copy the src URL from the iframe
const GOOGLE_MAPS_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15296.687557761139!2d80.53627085016531!3d16.567853346977373!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a35ef0835823063%3A0x8667960e6410e041!2sSanjana%26Srujana%20Heights!5e0!3m2!1sen!2sin!4v1777024674407!5m2!1sen!2sin" width="400" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade'
// ─────────────────────────────────────────────────────────────────

export default function Footer() {
  const [hoveredSocial, setHoveredSocial] = useState(null)
  const [hoveredLink, setHoveredLink] = useState(null)

  return (
    <>
      <style>{`
        @keyframes footerPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes footerShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes footerRkGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(232, 168, 56, 0.15); }
          50% { box-shadow: 0 0 24px rgba(232, 168, 56, 0.3); }
        }

        .footer-link-item {
          color: rgba(255,255,255,0.5);
          font-size: 13.5px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 10px;
          transition: all 0.25s ease;
        }
        .footer-link-item:hover {
          color: #E8A838 !important;
          background: rgba(232, 168, 56, 0.05) !important;
          padding-left: 18px !important;
        }

        .footer-contact-item:hover {
          background: rgba(232, 168, 56, 0.06) !important;
          border-color: rgba(232, 168, 56, 0.15) !important;
        }

        .footer-map-wrap:hover .footer-map-overlay {
          opacity: 0 !important;
        }

        .rk-badge:hover {
          border-color: rgba(232, 168, 56, 0.35) !important;
          background: rgba(232, 168, 56, 0.07) !important;
        }

        @media (max-width: 1200px) {
          .footer-4col {
            grid-template-columns: 1.5fr 1fr 1fr !important;
          }
          .footer-col-map {
            grid-column: 1 / -1 !important;
          }
          .footer-map-inner {
            height: 200px !important;
          }
        }
        @media (max-width: 768px) {
          .footer-4col {
            grid-template-columns: 1fr 1fr !important;
          }
          .footer-col-brand {
            grid-column: 1 / -1 !important;
          }
          .footer-col-map {
            grid-column: 1 / -1 !important;
          }
          .footer-map-inner {
            height: 220px !important;
          }
        }
        @media (max-width: 480px) {
          .footer-4col {
            grid-template-columns: 1fr !important;
          }
          .footer-bottom {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 16px !important;
          }
          .footer-bottom-links {
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
          .footer-social-row {
            justify-content: flex-start !important;
          }
          .footer-rk-row {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .footer-map-inner {
            height: 200px !important;
          }
        }
      `}</style>

      <footer style={{
        marginTop: '0',
        background: 'linear-gradient(180deg, #1B2A4A 0%, #12203A 50%, #0D1829 100%)',
        borderTop: '1px solid rgba(232, 168, 56, 0.12)',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Shimmer top border */}
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '80%', height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(232, 168, 56, 0.4), transparent)',
          backgroundSize: '200% 100%',
          animation: 'footerShimmer 4s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* Orb decorations */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232, 168, 56, 0.04) 0%, transparent 70%)',
          animation: 'footerPulse 8s ease infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(42, 157, 143, 0.03) 0%, transparent 70%)',
          animation: 'footerPulse 10s ease infinite 3s',
          pointerEvents: 'none',
        }} />

        {/* ── Main 4-col grid ── */}
        <div style={{
          maxWidth: '1580px', margin: '0 auto',
          padding: '56px 24px 44px',
          position: 'relative',
        }}>
          <div className="footer-4col" style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1.3fr',
            gap: '48px',
            marginBottom: '48px',
          }}>

            {/* ── Col 1: Brand ── */}
            <div className="footer-col-brand">
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: '12px', marginBottom: '20px',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(232, 168, 56, 0.2)',
                  flexShrink: 0,
                }}>
                  <Image src="/logo2.jpeg" alt="LDCE Logo" width={48} height={48}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div>
                  <span className={`nav-logo-title ${pacifico.className}`} style={{
                    fontWeight: 800, fontSize: '22px',
                    color: '#F2672A', display: 'block', lineHeight: 1,
                  }}>
                    LDCE Warriors
                  </span>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, color: '#E8A838',
                    letterSpacing: '2.5px', textTransform: 'uppercase',
                    marginTop: '4px', display: 'block',
                  }}>
                    Learn • Practice • Succeed
                  </span>
                </div>
              </div>

              <p style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: '13.5px', lineHeight: 1.75,
                maxWidth: '280px', marginBottom: '24px',
              }}>
                Your comprehensive preparation platform for Lower Departmental Competitive
                Examinations. Expert video lectures, structured courses, and proven study material.
              </p>

              {/* Social */}
              <div>
                <p style={{
                  fontSize: '10px', fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase', letterSpacing: '1.5px',
                  marginBottom: '12px',
                }}>
                  Follow Us
                </p>
                <div className="footer-social-row" style={{
                  display: 'flex', gap: '8px', flexWrap: 'wrap',
                }}>
                  {SOCIAL_LINKS.map(social => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => setHoveredSocial(social.label)}
                      onMouseLeave={() => setHoveredSocial(null)}
                      title={social.label}
                      style={{
                        width: '40px', height: '40px',
                        borderRadius: '12px',
                        background: hoveredSocial === social.label
                          ? social.color + '20'
                          : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${hoveredSocial === social.label
                          ? social.color + '40'
                          : 'rgba(255,255,255,0.08)'}`,
                        color: hoveredSocial === social.label
                          ? social.color
                          : 'rgba(255,255,255,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textDecoration: 'none',
                        transition: 'all 0.25s ease',
                        transform: hoveredSocial === social.label
                          ? 'translateY(-3px) scale(1.1)'
                          : 'none',
                        boxShadow: hoveredSocial === social.label
                          ? `0 8px 20px ${social.color}30`
                          : 'none',
                      }}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Col 2: Quick Links ── */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '24px',
              }}>
                <div style={{
                  width: '3px', height: '20px', borderRadius: '2px',
                  background: '#E8A838',
                }} />
                <span style={{
                  fontWeight: 700, color: '#E8A838',
                  fontSize: '11px', textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                }}>
                  Quick Links
                </span>
              </div>
              <ul style={{
                listStyle: 'none',
                display: 'flex', flexDirection: 'column', gap: '2px',
              }}>
                {QUICK_LINKS.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="footer-link-item"
                      onMouseEnter={() => setHoveredLink(link.href)}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>{link.icon}</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Col 3: Contact ── */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '24px',
              }}>
                <div style={{
                  width: '3px', height: '20px', borderRadius: '2px',
                  background: '#E8A838',
                }} />
                <span style={{
                  fontWeight: 700, color: '#E8A838',
                  fontSize: '11px', textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                }}>
                  Contact Us
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {CONTACT_INFO.map(item => {
                  const Tag = item.href ? 'a' : 'div'
                  return (
                    <Tag
                      key={item.label}
                      href={item.href || undefined}
                      className="footer-contact-item"
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '11px 14px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        cursor: item.href ? 'pointer' : 'default',
                      }}
                    >
                      <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>
                        {item.icon}
                      </span>
                      <div>
                        <p style={{
                          fontSize: '9px', fontWeight: 700,
                          color: 'rgba(255,255,255,0.25)',
                          textTransform: 'uppercase', letterSpacing: '1px',
                          marginBottom: '2px',
                        }}>
                          {item.label}
                        </p>
                        <p style={{
                          fontSize: '12.5px', fontWeight: 500,
                          color: item.href ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.45)',
                          lineHeight: 1.4,
                        }}>
                          {item.value}
                        </p>
                      </div>
                    </Tag>
                  )
                })}
              </div>
            </div>

            {/* ── Col 4: Map (NEW) ── */}
            <div className="footer-col-map">
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '3px', height: '20px', borderRadius: '2px',
                  background: '#E8A838',
                }} />
                <span style={{
                  fontWeight: 700, color: '#E8A838',
                  fontSize: '11px', textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                }}>
                  Find Us
                </span>
              </div>

              {/* Map container */}
              <div
                className="footer-map-wrap"
                style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(232, 168, 56, 0.15)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                }}
              >
                {/* Subtle tint overlay that fades on hover (see CSS) */}
                <div
                  className="footer-map-overlay"
                  style={{
                    position: 'absolute', inset: 0, zIndex: 2,
                    background: 'rgba(13, 24, 41, 0.12)',
                    pointerEvents: 'none',
                    transition: 'opacity 0.35s ease',
                  }}
                />

                {/* Gold border glow on top */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: 'linear-gradient(90deg, transparent, rgba(232, 168, 56, 0.5), transparent)',
                  zIndex: 3, pointerEvents: 'none',
                }} />

                {/* Actual Google Maps iframe */}
                <iframe
                  className="footer-map-inner"
                  src={GOOGLE_MAPS_EMBED_URL}
                  width="100%"
                  height="260"
                  style={{
                    border: 'none',
                    display: 'block',
                    width: '100%',
                    filter: 'saturate(0.7) contrast(1.05)',
                  }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="LDCE Warriors Location"
                />
              </div>

              {/* Open in Maps link */}
              <a
                href="https://maps.google.com/?q=India"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  marginTop: '10px',
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(232, 168, 56, 0.6)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#E8A838'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(232, 168, 56, 0.6)'}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in Google Maps
              </a>
            </div>

          </div>

          {/* ── Divider ── */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(232,168,56,0.15), rgba(255,255,255,0.05), rgba(232,168,56,0.15), transparent)',
            margin: '0 0 28px',
          }} />

          {/* ── Bottom row ── */}
          <div className="footer-bottom" style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px', flexWrap: 'wrap',
          }}>

            {/* Copyright */}
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
              © {new Date().getFullYear()}{' '}
              <span style={{ color: '#E8A838', fontWeight: 600 }}>LDCE Warriors</span>.
              All rights reserved.
            </p>

            {/* Legal links */}
            <div className="footer-bottom-links" style={{
              display: 'flex', gap: '20px', alignItems: 'center',
            }}>
              {[
                { label: 'Privacy Policy', href: '/' },
                { label: 'Terms of Service', href: '/' },
                { label: 'Refund Policy', href: '/' },
              ].map(link => (
                <Link key={link.label} href={link.href} style={{
                  color: 'rgba(255,255,255,0.25)', fontSize: '11px',
                  textDecoration: 'none', transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#E8A838'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* ── Designed by Ramakalpa Solutions ── */}
            <div className="footer-rk-row" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.2)',
              }}>
                Designed & Developed by
              </span>
              <a
                href="https://www.ramakalpasolutions.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="rk-badge"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '6px 14px', borderRadius: '999px',
                  background: 'rgba(232, 168, 56, 0.04)',
                  border: '1px solid rgba(232, 168, 56, 0.15)',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                  animation: 'footerRkGlow 4s ease infinite',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '5px',
                  background: 'linear-gradient(135deg, #E8A838, #D4922A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '10px', fontWeight: 800, color: '#1B2A4A',
                    lineHeight: 1,
                  }}>R</span>
                </div>
                <span style={{
                  fontSize: '12px', fontWeight: 700,
                  color: '#E8A838', letterSpacing: '0.3px',
                }}>
                  Ramakalpa Solutions
                </span>
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24"
                  stroke="#E8A838" style={{ opacity: 0.5 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}