import Link from 'next/link'
import { FiUnlock, FiArrowRight } from 'react-icons/fi'

export function chapterLabel(n) {
  return n || n === 0 ? `Chapter – ${String(n).padStart(2, '0')}` : 'Digital Textbook'
}

function PagesIcon() {
  return (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
      <rect x="4" y="2" width="22" height="28" rx="5" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2.6" />
      <path d="M20 2v6h6" fill="none" stroke="#7C3AED" strokeWidth="2.6" strokeLinejoin="round" />
      {[11, 16, 21].map(y => (
        <g key={y} fill="#7C3AED">
          <circle cx="9.5" cy={y} r="1.6" />
          <rect x="13" y={y - 1.4} width="9" height="2.8" rx="1.4" />
        </g>
      ))}
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
      <path d="M6 2h14l8 8v16a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" fill="#F0362A" />
      <path d="M20 2v6a2 2 0 0 0 2 2h6z" fill="#B91C1C" />
      <path
        d="M10 23c2-4 4-9 5-13 .4 3 2.3 6.5 6 8-3.5-.3-8 1.6-11 5z"
        fill="none" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"
      />
    </svg>
  )
}

export function BookIcon() {
  return (
    <svg viewBox="0 0 40 28" width="34" height="24" aria-hidden="true">
      <path d="M2 4c6-3 12-3 18 1v21c-6-4-12-4-18-1z" fill="#fff" />
      <path d="M38 4c-6-3-12-3-18 1v21c6-4 12-4 18-1z" fill="#fff" />
      <path d="M7 10c3-1 6-1 9 1M7 15c3-1 6-1 9 1M24 11c3-2 6-2 9-1M24 16c3-2 6-2 9-1"
        stroke="#C4B5FD" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function TextbookCard({ material, subtitle }) {
  const premium = material.accessType === 'PREMIUM'
  return (
    <article className="mat-card">
      <span className="mat-corner mat-corner-tl" />
      <span className="mat-corner mat-corner-br" />
      {premium && <span className="mat-premium">⭐ Premium</span>}

      <h3 className="mat-chapter">{chapterLabel(material.chapterNo)}</h3>
      <span className="mat-underline" />
      <h2 className="mat-title">{material.title}</h2>
      {subtitle && <p className="mat-topic">{subtitle}</p>}

      <div className="mat-stats">
        <div className="mat-stat">
          <PagesIcon />
          {material.pageCount ? <span><b>{material.pageCount}</b> Pages</span> : <span>Notes</span>}
        </div>
        <span className="mat-divider" />
        <div className="mat-stat">
          <PdfIcon />
          <span className="mat-pdf">PDF</span>
        </div>
      </div>

      {material.locked ? (
        <Link href="/join-family" className="mat-read mat-unlock">
          <span className="mat-unlock-icon"><FiUnlock /></span>
          <span className="mat-read-bar" />
          <span className="mat-read-text mat-unlock-text">Unlock Now</span>
          <FiArrowRight className="mat-read-arrow" />
        </Link>
      ) : (
        <Link href={`/materials/read/${material.id}`} className="mat-read">
          <BookIcon />
          <span className="mat-read-bar" />
          <span className="mat-read-text">READ NOW</span>
          <span className="mat-read-arrow">→</span>
        </Link>
      )}
    </article>
  )
}

// Shared styles for the textbook pages
export const textbookStyles = `
  .mat-page { background:#F5F3EF; min-height:70vh; padding:120px 16px 60px; }
  .mat-hero { text-align:center; max-width:700px; margin:0 auto 28px; }
  .mat-hero h1 { font-family:'Playfair Display', serif; font-size:clamp(28px,5vw,40px); font-weight:800; color:#C8102E; margin:0 0 6px; }
  .mat-hero p { color:#6B7280; font-size:15px; margin:0; }
  .mat-back { display:inline-flex; align-items:center; gap:6px; color:#1B2A4A; font-weight:700; font-size:14px; text-decoration:none; margin-bottom:12px; }
  .mat-back:hover { color:#D4922A; }

  .mat-grid { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,340px)); justify-content:center; gap:22px; }
  .mat-empty { text-align:center; color:#6B7280; padding:60px 0; }

  .mat-card {
    position:relative; overflow:hidden; background:#fff; border:1px solid #E4E2F3; border-radius:24px;
    padding:28px 22px 22px; display:flex; flex-direction:column; align-items:center; text-align:center;
    box-shadow:0 6px 20px rgba(76,29,149,.07); transition:transform .25s ease, box-shadow .25s ease;
  }
  .mat-card:hover { transform:translateY(-4px); box-shadow:0 14px 30px rgba(76,29,149,.14); }
  .mat-skeleton { height:300px; background:linear-gradient(90deg,#fff,#F3F1FA,#fff); background-size:200% 100%; animation:matShimmer 1.2s infinite; }
  @keyframes matShimmer { to { background-position:-200% 0 } }

  .mat-corner { position:absolute; pointer-events:none; }
  .mat-corner-tl { top:-40px; left:-40px; width:110px; height:80px; background:#F7B500; border-radius:0 0 100% 0; transform:rotate(-12deg); }
  .mat-corner-br { bottom:-50px; right:-50px; width:110px; height:110px; background:linear-gradient(135deg,#9333EA,#6D28D9); border-radius:100% 0 0 0; }
  .mat-premium { position:absolute; top:12px; right:12px; background:#FEF3C7; color:#92400E; font-size:11px; font-weight:800; padding:3px 9px; border-radius:999px; z-index:1; }

  .mat-chapter { position:relative; font-size:30px; font-weight:900; color:#0F1747; margin:0; letter-spacing:-.5px; }
  .mat-underline { display:block; width:70%; height:5px; margin:6px auto 14px; background:#F7B500; border-radius:50%; }
  .mat-title { font-size:24px; line-height:1.2; font-weight:900; color:#1238B4; margin:0 0 4px; word-break:break-word; }
  .mat-topic { color:#6B7280; font-size:13px; margin:2px 0 0; }

  .mat-stats { position:relative; width:100%; margin:18px 0; padding:12px 10px; background:#F6F5F9; border-radius:18px; display:flex; align-items:center; justify-content:space-around; gap:8px; }
  .mat-stat { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:800; color:#0F1747; }
  .mat-stat b { color:#7C3AED; font-size:22px; font-weight:900; }
  .mat-pdf { color:#E11D1D; font-size:20px; font-weight:900; }
  .mat-divider { width:2px; height:30px; background:#D1D5DB; border-radius:2px; }

  .mat-read {
    position:relative; width:100%; margin-top:auto; display:flex; align-items:center; gap:14px;
    padding:12px 20px; border:none; border-radius:999px; cursor:pointer; text-decoration:none;
    background:linear-gradient(180deg,#8B2CF5,#5B12C9); color:#fff;
    box-shadow:0 6px 16px rgba(109,40,217,.35); transition:filter .2s ease, transform .2s ease;
  }
  .mat-read:hover { filter:brightness(1.1); }
  .mat-read:active { transform:scale(.98); }
  .mat-read-bar { width:2px; height:24px; background:rgba(255,255,255,.85); border-radius:2px; }
  .mat-read-text { flex:1; text-align:left; font-size:18px; font-weight:900; letter-spacing:.5px; }
  .mat-read-arrow { font-size:24px; font-weight:900; line-height:1; flex-shrink:0; }

  .mat-unlock { background:linear-gradient(180deg,#FF1933,#C90013); box-shadow:0 6px 16px rgba(201,0,19,.3); }
  .mat-unlock-icon {
    width:38px; height:38px; flex-shrink:0; border-radius:50%; background:#fff; color:#CE071C;
    display:flex; align-items:center; justify-content:center; font-size:20px;
  }
  .mat-unlock-text { text-align:center; font-size:21px; letter-spacing:-.3px; }

  @media (max-width: 600px) {
    .mat-page { padding:100px 14px 44px; }
    .mat-grid { grid-template-columns:1fr; max-width:400px; }
    .mat-chapter { font-size:26px; }
    .mat-title { font-size:21px; }
  }
`
