// src/app/layout.js
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'LDCE Warriors — Lower Departmental Competitive Exams',
  description: 'Comprehensive preparation platform for Lower Departmental Competitive Examinations',
  keywords: 'LDCE, departmental exam, competitive exam, government preparation',
}

export default function RootLayout({ children }) {
  const telegramURL = 'https://t.me/ldcewarriors'

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style>{`
          /* Telegram Floating Button Styles */
          .telegram-float {
            position: fixed;
            bottom: 28px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
          }

          .telegram-tooltip {
            background: #1B2A4A;
            color: #FFFFFF;
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            font-weight: 700;
            padding: 8px 14px;
            border-radius: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            white-space: nowrap;
            opacity: 0;
            transform: translateX(10px);
            transition: all 0.3s ease;
            pointer-events: none;
            border: 1px solid rgba(232, 168, 56, 0.2);
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .telegram-float:hover .telegram-tooltip {
            opacity: 1;
            transform: translateX(0px);
          }

          .telegram-btn {
            width: 58px;
            height: 58px;
            background: linear-gradient(135deg, #2AABEE 0%, #229ED9 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            box-shadow:
              0 6px 24px rgba(34, 158, 217, 0.45),
              0 2px 8px rgba(0, 0, 0, 0.12);
            transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            cursor: pointer;
            border: 2px solid rgba(255, 255, 255, 0.2);
          }

          .telegram-btn:hover {
            transform: scale(1.12) translateY(-3px);
            box-shadow:
              0 12px 32px rgba(34, 158, 217, 0.55),
              0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .telegram-btn:active {
            transform: scale(0.96);
          }

          .telegram-btn svg {
            width: 30px;
            height: 30px;
            fill: #ffffff;
            transition: transform 0.3s ease;
            margin-right: 2px;
            margin-top: -1px;
          }

          .telegram-btn:hover svg {
            transform: rotate(-10deg) scale(1.08);
          }

          /* Pulse Ring Animation */
          .telegram-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(34, 158, 217, 0.4);
            animation: telegram-pulse 2.2s ease-out infinite;
          }

          .telegram-btn::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(34, 158, 217, 0.2);
            animation: telegram-pulse 2.2s ease-out infinite 0.7s;
          }

          @keyframes telegram-pulse {
            0% {
              transform: scale(1);
              opacity: 0.8;
            }
            70% {
              transform: scale(1.55);
              opacity: 0;
            }
            100% {
              transform: scale(1.55);
              opacity: 0;
            }
          }

          /* Responsive Adjustments */
          @media (max-width: 768px) {
            .telegram-float {
              bottom: 20px;
              right: 16px;
            }

            .telegram-btn {
              width: 52px;
              height: 52px;
            }

            .telegram-btn svg {
              width: 26px;
              height: 26px;
            }

            .telegram-tooltip {
              font-size: 12px;
              padding: 6px 12px;
            }
          }

          @media (max-width: 480px) {
            .telegram-float {
              bottom: 16px;
              right: 14px;
            }

            .telegram-btn {
              width: 48px;
              height: 48px;
            }

            .telegram-btn svg {
              width: 24px;
              height: 24px;
            }
          }

          /* Reduce motion for accessibility */
          @media (prefers-reduced-motion: reduce) {
            .telegram-btn::before,
            .telegram-btn::after {
              animation: none;
            }

            .telegram-btn {
              transition: none;
            }
          }
        `}</style>
      </head>
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#1A1D23',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              fontFamily: 'DM Sans, sans-serif',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
            },
            success: {
              iconTheme: { primary: '#2A9D8F', secondary: '#FFFFFF' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#FFFFFF' },
            },
            duration: 4000,
          }}
        />

        {/* ── Telegram Floating Button ── */}
        <div className="telegram-float">
          <span className="telegram-tooltip">
            <span style={{ color: '#E8A838' }}>⚡</span> Join Telegram Group
          </span>
          <a
            href={telegramURL}
            target="_blank"
            rel="noopener noreferrer"
            className="telegram-btn"
            aria-label="Join our Telegram group - LDCE Warriors"
            title="Join Telegram Group"
          >
            {/* Official Telegram Paper Airplane SVG Icon */}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.535-.194 1.006.128.828.942z"/>
            </svg>
          </a>
        </div>

        {children}
      </body>
    </html>
  )
}