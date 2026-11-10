'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { chapterLabel } from '@/components/materials/TextbookCard'
import MovingWatermark from '@/components/ui/MovingWatermark'

/*
  Protected in-site PDF reader.
  - Pages are drawn as images on <canvas> (no text layer → nothing to select or copy).
  - The PDF is downloaded once into memory through a 60-second link; no file link is shown.
  - Right-click, drag, print, save, copy and dev-tools shortcuts are blocked.
  - Content is hidden when the window loses focus, the tab is hidden,
    or screenshot keys are pressed.
  - Every page carries a watermark with the reader's name and email.
  Browsers cannot fully stop OS-level screenshots or screen recording;
  the watermark makes any leaked copy traceable.
*/

const MIN_ZOOM = 0.6
const MAX_ZOOM = 2
const BASE_WIDTH = 860

function drawWatermark(ctx, width, height, text, scale) {
  ctx.save()
  ctx.globalAlpha = 0.13
  ctx.fillStyle = '#1B2A4A'
  ctx.font = `700 ${Math.round(18 * scale)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.translate(width / 2, height / 2)
  ctx.rotate(-Math.PI / 6)
  const stepY = 140 * scale
  const stepX = Math.max(ctx.measureText(text).width + 90 * scale, 260 * scale)
  const span = Math.hypot(width, height)
  for (let y = -span; y < span; y += stepY) {
    const offset = (Math.round(y / stepY) % 2) * (stepX / 2)
    for (let x = -span; x < span; x += stepX) {
      ctx.fillText(text, x + offset, y)
    }
  }
  ctx.restore()
}

function PdfPage({ pdf, pageNum, width, ratio, watermark, onVisible }) {
  const holderRef = useRef(null)
  const canvasRef = useRef(null)
  const [near, setNear] = useState(pageNum <= 2)
  const [pageRatio, setPageRatio] = useState(ratio)

  // Only render pages near the screen
  useEffect(() => {
    const el = holderRef.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setNear(true)),
      { rootMargin: '800px 0px' }
    )
    io.observe(el)

    const visibleIo = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && onVisible(pageNum)),
      { threshold: 0.5 }
    )
    visibleIo.observe(el)
    return () => { io.disconnect(); visibleIo.disconnect() }
  }, [pageNum, onVisible])

  useEffect(() => {
    if (!near || !pdf) return
    let task
    let cancelled = false

    pdf.getPage(pageNum).then(page => {
      if (cancelled) return
      const base = page.getViewport({ scale: 1 })
      setPageRatio(base.height / base.width)

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const scale = (width / base.width) * dpr
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext('2d')

      task = page.render({ canvasContext: ctx, viewport })
      task.promise
        .then(() => !cancelled && drawWatermark(ctx, canvas.width, canvas.height, watermark, dpr * (width / BASE_WIDTH) * 1.2))
        .catch(() => {})
    })

    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [near, pdf, pageNum, width, watermark])

  return (
    <div
      ref={holderRef}
      className="rd-page"
      style={{ width, height: Math.round(width * pageRatio) }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <span className="rd-page-no">{pageNum}</span>
    </div>
  )
}

export default function TextbookReaderPage() {
  const { id } = useParams()
  const router = useRouter()
  const stageRef = useRef(null)
  const pdfRef = useRef(null)

  const [info, setInfo] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [ratio, setRatio] = useState(1.414)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [fitWidth, setFitWidth] = useState(BASE_WIDTH)
  const [currentPage, setCurrentPage] = useState(1)
  const [shielded, setShielded] = useState(false)

  /* ── Load the textbook ── */
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/materials/${id}/read`, { method: 'POST', cache: 'no-store' })
        const data = await res.json()
        if (!data.success) {
          if (!cancelled) {
            setError(data)
            setStatus('error')
          }
          return
        }
        if (cancelled) return
        setInfo(data)

        const fileRes = await fetch(data.url, { cache: 'no-store' })
        if (!fileRes.ok) throw new Error('Unable to load textbook file')
        const bytes = await fileRes.arrayBuffer()

        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const doc = await pdfjs.getDocument({
          data: new Uint8Array(bytes),
          isEvalSupported: false,
          disableAutoFetch: true,
        }).promise

        if (cancelled) { doc.destroy(); return }
        const first = await doc.getPage(1)
        const vp = first.getViewport({ scale: 1 })
        pdfRef.current = doc
        setRatio(vp.height / vp.width)
        setNumPages(doc.numPages)
        setPdf(doc)
        setStatus('ready')
      } catch (err) {
        if (!cancelled) {
          setError({ error: err.message || 'Unable to open textbook' })
          setStatus('error')
        }
      }
    }

    load()
    return () => {
      cancelled = true
      pdfRef.current?.destroy()
      pdfRef.current = null
    }
  }, [id])

  /* ── Fit page width to screen ── */
  useEffect(() => {
    function measure() {
      const w = stageRef.current?.clientWidth || window.innerWidth
      setFitWidth(Math.min(BASE_WIDTH, w - 24))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [status])

  /* ── Protection: block shortcuts, hide on focus loss / screenshot keys ── */
  useEffect(() => {
    const hide = () => setShielded(true)

    function onKeyDown(e) {
      const key = (e.key || '').toLowerCase()
      const mod = e.ctrlKey || e.metaKey

      if (key === 'printscreen' || key === 'f12') {
        e.preventDefault()
        hide()
        navigator.clipboard?.writeText?.('').catch(() => {})
        return
      }
      // macOS screenshot shortcuts start with Cmd + Shift
      if (e.metaKey && e.shiftKey) { hide(); e.preventDefault(); return }
      // Windows Snipping Tool: Win + Shift + S
      if (key === 's' && e.shiftKey && (e.metaKey || e.getModifierState?.('OS'))) { hide(); e.preventDefault(); return }
      if (mod && ['s', 'p', 'c', 'x', 'a', 'u'].includes(key)) { e.preventDefault(); return }
      if (mod && e.shiftKey && ['i', 'j', 'c'].includes(key)) { e.preventDefault(); hide() }
    }

    function onKeyUp(e) {
      if ((e.key || '').toLowerCase() === 'printscreen') {
        navigator.clipboard?.writeText?.('').catch(() => {})
        hide()
      }
    }

    const onVisibility = () => document.hidden && hide()
    const block = e => e.preventDefault()

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', hide)
    window.addEventListener('beforeprint', hide)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('contextmenu', block)
    document.addEventListener('copy', block)
    document.addEventListener('cut', block)
    document.addEventListener('dragstart', block)
    document.addEventListener('selectstart', block)

    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('blur', hide)
      window.removeEventListener('beforeprint', hide)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('copy', block)
      document.removeEventListener('cut', block)
      document.removeEventListener('dragstart', block)
      document.removeEventListener('selectstart', block)
    }
  }, [])

  const onVisible = useCallback(n => setCurrentPage(n), [])
  const pageWidth = Math.round(fitWidth * zoom)
  const material = info?.material

  function goBack() {
    if (material?.topic?.id) router.push(`/materials/topic/${material.topic.id}`)
    else router.push('/materials')
  }

  return (
    <div className="rd-root">
      <header className="rd-bar">
        <button className="rd-btn" onClick={goBack} aria-label="Back">←</button>
        <div className="rd-titles">
          <span className="rd-chapter">{material ? chapterLabel(material.chapterNo) : 'Digital Textbook'}</span>
          <strong>{material?.title || 'Loading…'}</strong>
        </div>
        {status === 'ready' && (
          <div className="rd-tools">
            <span className="rd-count">{currentPage} / {numPages}</span>
            <button className="rd-btn" onClick={() => setZoom(z => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(1)))} aria-label="Zoom out">−</button>
            <span className="rd-zoom">{Math.round(zoom * 100)}%</span>
            <button className="rd-btn" onClick={() => setZoom(z => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(1)))} aria-label="Zoom in">+</button>
          </div>
        )}
      </header>

      <main ref={stageRef} className="rd-stage">
        {status === 'loading' && (
          <div className="rd-msg">
            <div className="rd-spinner" />
            <p>Opening textbook…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="rd-msg">
            <p className="rd-err">{error?.error || 'Unable to open textbook'}</p>
            {error?.loginRequired && <Link href="/auth/login" className="rd-cta">Sign In</Link>}
            {error?.premiumRequired && <Link href="/join-family" className="rd-cta">⭐ Join Family</Link>}
            <button className="rd-link" onClick={goBack}>← Back to textbooks</button>
          </div>
        )}

        {status === 'ready' && (
          <div className="rd-pages">
            {Array.from({ length: numPages }, (_, i) => (
              <PdfPage
                key={`${i + 1}-${pageWidth}`}
                pdf={pdf}
                pageNum={i + 1}
                width={pageWidth}
                ratio={ratio}
                watermark={info.watermark}
                onVisible={onVisible}
              />
            ))}
          </div>
        )}
      </main>

      {/* Moving name + phone on top of the pages (printed watermark is on each page too) */}
      {status === 'ready' && info?.watermark && (
        <MovingWatermark
          text={info.watermark.split(' • ').slice(0, 2).join(' • ')}
          mode="page"
          zIndex={10000}
        />
      )}

      {shielded && (
        <button className="rd-shield" onClick={() => setShielded(false)}>
          <span>🔒</span>
          <strong>Content hidden</strong>
          <small>Tap anywhere to continue reading</small>
        </button>
      )}

      <style>{`
        .rd-root {
          position:fixed; inset:0; z-index:10000; display:flex; flex-direction:column;
          background:#2B2F3A; color:#fff;
          -webkit-user-select:none; user-select:none; -webkit-touch-callout:none;
        }
        .rd-bar {
          flex-shrink:0; display:flex; align-items:center; gap:12px; padding:10px 14px;
          background:#1B2A4A; box-shadow:0 2px 10px rgba(0,0,0,.25);
        }
        .rd-titles { flex:1; min-width:0; display:flex; flex-direction:column; }
        .rd-chapter { font-size:11px; color:#E8A838; font-weight:800; letter-spacing:.5px; text-transform:uppercase; }
        .rd-titles strong { font-size:15px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .rd-tools { display:flex; align-items:center; gap:8px; }
        .rd-count, .rd-zoom { font-size:13px; font-weight:700; color:#CBD5E1; min-width:44px; text-align:center; }
        .rd-btn {
          width:36px; height:36px; border-radius:10px; border:1px solid rgba(255,255,255,.18);
          background:rgba(255,255,255,.08); color:#fff; font-size:18px; font-weight:800; cursor:pointer;
        }
        .rd-btn:hover { background:rgba(255,255,255,.18); }
        .rd-stage { flex:1; overflow:auto; padding:18px 12px 40px; }
        .rd-pages { display:flex; flex-direction:column; align-items:center; gap:14px; }
        .rd-page {
          position:relative; flex-shrink:0; background:#fff; border-radius:4px; overflow:hidden;
          box-shadow:0 6px 20px rgba(0,0,0,.35); pointer-events:none;
        }
        .rd-page canvas { display:block; }
        .rd-page-no {
          position:absolute; bottom:6px; right:8px; font-size:11px; font-weight:700;
          background:rgba(27,42,74,.75); color:#fff; padding:2px 7px; border-radius:6px;
        }
        .rd-msg { height:100%; min-height:300px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; text-align:center; }
        .rd-err { font-size:16px; font-weight:700; max-width:360px; }
        .rd-cta { background:#E8A838; color:#1B2A4A; padding:10px 22px; border-radius:10px; font-weight:800; text-decoration:none; }
        .rd-link { background:none; border:none; color:#CBD5E1; font-weight:700; cursor:pointer; font-size:14px; }
        .rd-spinner { width:40px; height:40px; border-radius:50%; border:4px solid rgba(255,255,255,.2); border-top-color:#E8A838; animation:rdSpin 1s linear infinite; }
        @keyframes rdSpin { to { transform:rotate(360deg) } }
        .rd-shield {
          position:fixed; inset:0; z-index:10001; border:none; cursor:pointer;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
          background:rgba(17,24,39,.97); color:#fff; backdrop-filter:blur(30px);
        }
        .rd-shield span { font-size:40px; }
        .rd-shield strong { font-size:20px; }
        .rd-shield small { color:#9CA3AF; font-size:14px; }

        @media print {
          body * { visibility:hidden !important; }
          body::after { content:'Printing is disabled for LDCE Warriors textbooks.'; visibility:visible; }
        }

        @media (max-width: 600px) {
          .rd-bar { padding:8px 10px; gap:8px; }
          .rd-zoom { display:none; }
          .rd-btn { width:32px; height:32px; font-size:16px; }
          .rd-stage { padding:12px 6px 30px; }
        }
      `}</style>
    </div>
  )
}
