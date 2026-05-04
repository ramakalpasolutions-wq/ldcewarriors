// src/components/ui/AdminLoadingScreen.js
'use client'
import { useState, useEffect } from 'react'

export default function AdminLoadingScreen({ onFinished }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0)
  const [visible, setVisible] = useState(true)

  const phases = [
    'Initializing secure connection...',
    'Verifying encryption protocols...',
    'Loading admin modules...',
    'Establishing session...',
    'Access granted',
  ]

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      current += Math.random() * 12 + 3
      if (current >= 100) {
        current = 100
        clearInterval(interval)
        setTimeout(() => {
          setVisible(false)
          setTimeout(() => onFinished?.(), 500)
        }, 600)
      }
      setProgress(Math.min(100, current))
      setPhase(Math.min(phases.length - 1, Math.floor((current / 100) * phases.length)))
    }, 120)

    return () => clearInterval(interval)
  }, [onFinished])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#0D1829',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.5s ease',
      opacity: progress >= 100 ? 0 : 1,
    }}>
      <style>{`
        @keyframes adminPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes adminGlitch {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
        }
        @keyframes adminBlink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0; }
        }
        @keyframes adminScanDown {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes adminTypewriter {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>

      {/* Grid background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(232, 168, 56, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(232, 168, 56, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Scan line */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(232, 168, 56, 0.2), transparent)',
        animation: 'adminScanDown 3s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Shield icon */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '20px',
        background: 'rgba(232, 168, 56, 0.08)',
        border: '1px solid rgba(232, 168, 56, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '36px',
        marginBottom: '32px',
        animation: 'adminPulse 2s ease-in-out infinite',
      }}>
        🛡️
      </div>

      {/* Title */}
      <h2 style={{
        fontFamily: 'Playfair Display, serif',
        fontWeight: 800,
        fontSize: '24px',
        color: '#FFFFFF',
        letterSpacing: '-0.5px',
        marginBottom: '6px',
        animation: progress > 90 ? 'adminGlitch 0.3s ease' : 'none',
      }}>
        LDCE Admin
      </h2>

      <p style={{
        fontSize: '11px',
        color: '#E8A838',
        fontWeight: 700,
        letterSpacing: '3px',
        textTransform: 'uppercase',
        marginBottom: '40px',
      }}>
        SECURE PORTAL
      </p>

      {/* Progress bar */}
      <div style={{
        width: '280px',
        maxWidth: '80vw',
        marginBottom: '16px',
      }}>
        <div style={{
          height: '3px',
          borderRadius: '2px',
          background: 'rgba(232, 168, 56, 0.1)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #1B2A4A, #E8A838)',
            width: `${progress}%`,
            transition: 'width 0.15s ease',
            boxShadow: '0 0 10px rgba(232, 168, 56, 0.4)',
          }} />
        </div>
      </div>

      {/* Phase text */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minHeight: '20px',
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          color: progress >= 100
            ? '#2A9D8F'
            : 'rgba(232, 168, 56, 0.6)',
          letterSpacing: '0.5px',
          transition: 'color 0.3s ease',
        }}>
          {progress >= 100 ? '✓ ' : '> '}
          {phases[phase]}
        </span>
        {progress < 100 && (
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '14px',
            background: 'rgba(232, 168, 56, 0.6)',
            animation: 'adminBlink 1s step-end infinite',
          }} />
        )}
      </div>

      {/* Progress percentage */}
      <p style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.2)',
        marginTop: '24px',
        letterSpacing: '2px',
      }}>
        {Math.round(progress)}%
      </p>
    </div>
  )
}