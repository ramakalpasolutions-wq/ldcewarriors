'use client'
import { useState } from 'react'

export default function TelegramFloatingWidget() {
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <style>{`
        @keyframes tgPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 158, 217, 0.5), 0 8px 24px rgba(0, 0, 0, 0.25);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(34, 158, 217, 0), 0 12px 30px rgba(34, 158, 217, 0.35);
          }
        }
        @keyframes tgTooltipIn {
          from { opacity: 0; transform: translateX(10px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }

        .tg-float-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .tg-icon-circle {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2AABEE 0%, #229ED9 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: tgPulse 3s infinite;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .tg-float-btn:hover .tg-icon-circle {
          transform: scale(1.1) rotate(-8deg);
        }

        .tg-tooltip {
          background: #1B2A4A;
          color: #FFFFFF;
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(232, 168, 56, 0.2);
          display: flex;
          align-items: center;
          gap: 6px;
          animation: tgTooltipIn 0.25s ease both;
          pointer-events: none;
        }

        @media (max-width: 640px) {
          .tg-float-btn {
            bottom: 18px;
            right: 18px;
          }
          .tg-icon-circle {
            width: 48px;
            height: 48px;
          }
          .tg-tooltip {
            display: none; /* Hide text on small screens for cleaner mobile UI */
          }
        }
      `}</style>

      <a
        href="https://t.me/ldcewarriors"
        target="_blank"
        rel="noopener noreferrer"
        className="tg-float-btn"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Join our Telegram Group"
      >
        {hovered && (
          <div className="tg-tooltip">
            <span style={{ color: '#E8A838' }}>⚡</span> Join Telegram Group
          </div>
        )}

        <div className="tg-icon-circle">
          {/* Official Telegram Icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </div>
      </a>
    </>
  )
}