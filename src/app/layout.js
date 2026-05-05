// src/app/layout.js
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'LDCE Warriors — Lower Departmental Competitive Exams',
  description: 'Comprehensive preparation platform for Lower Departmental Competitive Examinations',
  keywords: 'LDCE, departmental exam, competitive exam, government preparation',
}

export default function RootLayout({ children }) {
  const whatsappMessage = encodeURIComponent('Hii , LDCE Warriors')
  const whatsappNumber = '919912986746' 
  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

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
          /* WhatsApp Floating Button Styles */
          .whatsapp-float {
            position: fixed;
            bottom: 28px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
          }

          .whatsapp-tooltip {
            background: #ffffff;
            color: #1A1D23;
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            font-weight: 500;
            padding: 8px 14px;
            border-radius: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
            white-space: nowrap;
            opacity: 0;
            transform: translateX(10px);
            transition: all 0.3s ease;
            pointer-events: none;
            border: 1px solid #E5E7EB;
          }

          .whatsapp-float:hover .whatsapp-tooltip {
            opacity: 1;
            transform: translateX(0px);
          }

          .whatsapp-btn {
            width: 58px;
            height: 58px;
            background: linear-gradient(135deg, #25D366, #128C7E);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            box-shadow:
              0 6px 24px rgba(37, 211, 102, 0.45),
              0 2px 8px rgba(0, 0, 0, 0.12);
            transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            cursor: pointer;
          }

          .whatsapp-btn:hover {
            transform: scale(1.12) translateY(-3px);
            box-shadow:
              0 12px 32px rgba(37, 211, 102, 0.55),
              0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .whatsapp-btn:active {
            transform: scale(0.96);
          }

          .whatsapp-btn svg {
            width: 30px;
            height: 30px;
            fill: #ffffff;
            transition: transform 0.3s ease;
          }

          .whatsapp-btn:hover svg {
            transform: rotate(-8deg) scale(1.05);
          }

          /* Pulse Ring Animation */
          .whatsapp-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(37, 211, 102, 0.4);
            animation: whatsapp-pulse 2.2s ease-out infinite;
          }

          .whatsapp-btn::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(37, 211, 102, 0.2);
            animation: whatsapp-pulse 2.2s ease-out infinite 0.7s;
          }

          @keyframes whatsapp-pulse {
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
            .whatsapp-float {
              bottom: 20px;
              right: 16px;
            }

            .whatsapp-btn {
              width: 52px;
              height: 52px;
            }

            .whatsapp-btn svg {
              width: 26px;
              height: 26px;
            }

            .whatsapp-tooltip {
              font-size: 12px;
              padding: 6px 12px;
            }
          }

          @media (max-width: 480px) {
            .whatsapp-float {
              bottom: 16px;
              right: 14px;
            }

            .whatsapp-btn {
              width: 48px;
              height: 48px;
            }

            .whatsapp-btn svg {
              width: 24px;
              height: 24px;
            }
          }

          /* Reduce motion for accessibility */
          @media (prefers-reduced-motion: reduce) {
            .whatsapp-btn::before,
            .whatsapp-btn::after {
              animation: none;
            }

            .whatsapp-btn {
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

        {/* ── WhatsApp Floating Button ── */}
        <div className="whatsapp-float">
          <span className="whatsapp-tooltip">💬 Chat with us!</span>
          <a
            href={whatsappURL}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn"
            aria-label="Chat on WhatsApp — Send Hi to LDCE Warriors"
            title="Chat on WhatsApp"
          >
            {/* Official WhatsApp SVG Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.504 1.13 6.752 3.054 9.384L1.054 31l5.784-1.852C9.21 30.868 12.498 32 16.004 32 24.828 32 32 24.822 32 16S24.828 0 16.004 0zm9.394 22.592c-.39 1.098-1.93 2.01-3.168 2.276-.844.18-1.946.322-5.656-1.216-4.746-1.952-7.804-6.768-8.038-7.082-.226-.314-1.896-2.526-1.896-4.818 0-2.292 1.196-3.408 1.62-3.84.39-.4.848-.5 1.132-.5.282 0 .564.002.81.014.26.012.608-.1.952.726.356.848 1.21 2.924 1.316 3.136.106.212.177.46.035.736-.134.284-.2.46-.4.708-.2.248-.42.554-.6.744-.2.2-.408.418-.176.82.232.4 1.032 1.7 2.216 2.754 1.524 1.358 2.808 1.778 3.208 1.978.4.2.632.168.864-.1.24-.276 1.02-1.19 1.292-1.598.27-.408.54-.34.908-.204.368.136 2.34 1.102 2.74 1.302.4.2.666.298.766.464.098.168.098.968-.292 2.066z" />
            </svg>
          </a>
        </div>

        {children}
      </body>
    </html>
  )
}