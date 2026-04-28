// src/app/admin/hero/page.js
'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const tk = {
  navy:'#1B2A4A', navyLight:'#243656',
  gold:'#E8A838', goldDark:'#D4922A',
  teal:'#2A9D8F',
  bg:'#F5F3EF', card:'#FFFFFF',
  border:'#E5E7EB', text:'#1A1D23',
  muted:'#6B7280', faint:'#9CA3AF',
}

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/(1024*1024)).toFixed(1)} MB`
}

const TYPE_CONFIG = {
  image:   { icon:'🖼️',  label:'Image',   badge:{ bg:'#EFF6FF', color:'#3B82F6' }, accept:'image/*',  maxMB:10,  hint:'JPG, PNG, WEBP — Max 10MB'  },
  video:   { icon:'🎬',  label:'Video',   badge:{ bg:'#F5F3FF', color:'#8B5CF6' }, accept:'video/*',  maxMB:500, hint:'MP4, MOV, WEBM — Max 500MB' },
  article: { icon:'📰',  label:'Article', badge:{ bg:'#ECFDF5', color:'#10B981' }, accept:'image/*',  maxMB:10,  hint:'JPG, PNG, WEBP — Max 10MB'  },
}

function UploadProgress({ progress, isVideo }) {
  const stages = isVideo
    ? ['Preparing…','Uploading…','Processing…','Done!']
    : ['Preparing…','Uploading…','Done!']
  const stageIdx = progress < 20 ? 0 : progress < 85 ? 1 : progress < 95 ? 2 : 3
  return (
    <div style={{ padding:'16px 18px', borderRadius:'14px', background:'linear-gradient(135deg,rgba(27,42,74,0.03),rgba(232,168,56,0.04))', border:'1.5px solid rgba(232,168,56,0.2)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
        <span style={{ fontSize:'13px', fontWeight:600, color:tk.text }}>
          {isVideo ? '☁️' : '🖼️'} {stages[Math.min(stageIdx, stages.length-1)]}
        </span>
        <span style={{ fontSize:'13px', fontWeight:700, color:tk.gold }}>{progress}%</span>
      </div>
      <div style={{ height:'7px', borderRadius:'999px', background:'rgba(27,42,74,0.08)', overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:'999px', width:`${progress}%`, background:`linear-gradient(90deg,${tk.navy},${tk.gold})`, transition:'width 0.5s ease', boxShadow:'0 0 10px rgba(232,168,56,0.4)' }}/>
      </div>
      {isVideo && progress < 90 && (
        <p style={{ fontSize:'11px', color:tk.faint, marginTop:'8px', textAlign:'center' }}>
          Large videos may take a minute — please wait…
        </p>
      )}
    </div>
  )
}

export default function AdminHeroPage() {
  const [slides,   setSlides  ] = useState([])
  const [loading,  setLoading ] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving  ] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [form, setForm] = useState({ type:'image', title:'', order:0, media:null, mediaPreview:'' })

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const fetchSlides = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/hero', { credentials:'include' })
      const data = await res.json()
      if (data.success) setSlides(data.items || [])
      else toast.error(data.error || 'Failed to load slides')
    } catch { toast.error('Failed to fetch hero slides') }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSlides() }, [fetchSlides])

  function resetForm() {
    setForm({ type:'image', title:'', order:0, media:null, mediaPreview:'' })
    setProgress(0)
  }

  function handleTypeChange(newType) {
    if (saving) return
    setForm(f => ({ ...f, type:newType, media:null, mediaPreview:'' }))
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const cfg = TYPE_CONFIG[form.type]
    if (f.size > cfg.maxMB*1024*1024) { toast.error(`File must be under ${cfg.maxMB}MB`); e.target.value=''; return }
    setForm(prev => ({ ...prev, media:f, mediaPreview:f.type.startsWith('image/') ? URL.createObjectURL(f) : '' }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.media)        { toast.error('Media file is required'); return }
    setSaving(true); setProgress(10)
    let progressInterval = null
    try {
      const fd = new FormData()
      fd.append('type', form.type)
      fd.append('title', form.title.trim())
      fd.append('order', String(form.order))
      fd.append('media', form.media)
      if (form.type === 'video') {
        setProgress(15)
        progressInterval = setInterval(() => {
          setProgress(prev => { if (prev >= 82) { clearInterval(progressInterval); progressInterval=null; return 82 } return prev + Math.random()*4 })
        }, 700)
      } else { setProgress(35) }
      const res  = await fetch('/api/admin/hero', { method:'POST', credentials:'include', body:fd })
      if (progressInterval) { clearInterval(progressInterval); progressInterval=null }
      setProgress(92)
      const data = await res.json()
      if (data.success) {
        setProgress(100)
        toast.success(form.type === 'video' ? '✅ Video uploaded!' : '✅ Hero slide added!')
        resetForm(); setShowForm(false); await fetchSlides()
      } else toast.error(data.error || 'Failed to add slide')
    } catch (err) { console.error(err); toast.error('Upload failed. Please try again.') }
    finally {
      if (progressInterval) clearInterval(progressInterval)
      setTimeout(() => { setSaving(false); setProgress(0) }, 600)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this hero slide? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res  = await fetch(`/api/admin/hero?id=${id}`, { method:'DELETE', credentials:'include' })
      const data = await res.json()
      if (data.success) { setSlides(prev => prev.filter(s => s._id !== id && s.id !== id)); toast.success('Slide deleted') }
      else toast.error(data.error || 'Delete failed')
    } catch { toast.error('Failed to delete slide') }
    setDeleting(null)
  }

  const cfg = TYPE_CONFIG[form.type]

  return (
    <>
      <style>{`
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        *,*::before,*::after { box-sizing:border-box; }

        .hero-pg { display:flex; flex-direction:column; gap:${isMobile ? '14px' : '22px'}; animation:fadeInUp .4s ease both; }

        .hero-type-btn {
          padding:${isMobile ? '10px 6px' : '14px 10px'}; border-radius:12px;
          border:2px solid ${tk.border}; background:#FAFAFA; cursor:pointer;
          text-align:center; font-family:inherit;
          transition:all .22s cubic-bezier(.34,1.56,.64,1);
        }
        .hero-type-btn:hover:not(.active):not(:disabled) { border-color:rgba(232,168,56,0.35); background:rgba(232,168,56,0.04); transform:translateY(-2px); }
        .hero-type-btn.active { border-color:${tk.navy}; background:rgba(27,42,74,0.05); box-shadow:0 4px 16px rgba(27,42,74,0.12); transform:translateY(-2px); }
        .hero-type-btn:disabled { opacity:.5; cursor:not-allowed; }
        .hero-type-icon  { font-size:${isMobile ? '20px' : '24px'}; margin-bottom:${isMobile ? '3px' : '5px'}; }
        .hero-type-label { font-size:${isMobile ? '10px' : '12px'}; font-weight:600; color:${tk.muted}; }
        .hero-type-btn.active .hero-type-label { color:${tk.navy}; }

        .hero-drop {
          border:2px dashed ${tk.border}; border-radius:14px;
          padding:${isMobile ? '20px 14px' : '28px 20px'}; text-align:center;
          cursor:pointer; transition:all .22s ease;
          background:rgba(27,42,74,0.02); position:relative; overflow:hidden;
        }
        .hero-drop:hover:not(.disabled) { border-color:rgba(232,168,56,0.4); background:rgba(232,168,56,0.03); }
        .hero-drop.has-file { border-color:rgba(42,157,143,0.4); background:rgba(42,157,143,0.03); }
        .hero-drop.disabled { opacity:.6; cursor:not-allowed; }
        .hero-drop input[type=file] { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
        .hero-drop input[type=file]:disabled { cursor:not-allowed; }

        .hero-lbl { display:block; font-size:12px; font-weight:700; color:${tk.navy}; margin-bottom:6px; letter-spacing:.3px; }
        .hero-lbl-req { color:${tk.gold}; margin-left:2px; }

        .hero-table-wrap { border-radius:${isMobile ? '14px' : '16px'}; overflow:hidden; border:1.5px solid ${tk.border}; background:${tk.card}; }
        .hero-table { width:100%; border-collapse:collapse; }
        .hero-table th { padding:${isMobile ? '10px 12px' : '12px 14px'}; font-size:11px; font-weight:700; color:${tk.faint}; text-transform:uppercase; letter-spacing:.8px; text-align:left; border-bottom:1.5px solid ${tk.border}; white-space:nowrap; background:rgba(27,42,74,0.03); }
        .hero-table td { padding:${isMobile ? '10px 12px' : '12px 14px'}; font-size:13px; color:${tk.muted}; border-bottom:1px solid rgba(229,231,235,.6); vertical-align:middle; }
        .hero-table tbody tr:last-child td { border-bottom:none; }
        .hero-table tbody tr:hover td { background:rgba(27,42,74,0.015); }

        .hero-thumb { width:${isMobile ? '54px' : '68px'}; height:${isMobile ? '34px' : '43px'}; border-radius:8px; object-fit:cover; border:1.5px solid ${tk.border}; flex-shrink:0; }
        .hero-thumb-ph { width:${isMobile ? '54px' : '68px'}; height:${isMobile ? '34px' : '43px'}; border-radius:8px; background:rgba(27,42,74,0.06); display:flex; align-items:center; justify-content:center; font-size:${isMobile ? '18px' : '22px'}; flex-shrink:0; border:1.5px solid ${tk.border}; }

        .hero-del-btn { font-size:${isMobile ? '11px' : '12px'}; font-weight:600; color:#ef4444; background:none; border:1.5px solid transparent; cursor:pointer; padding:${isMobile ? '5px 8px' : '5px 12px'}; border-radius:8px; transition:all .2s; font-family:inherit; white-space:nowrap; }
        .hero-del-btn:hover:not(:disabled) { background:rgba(239,68,68,0.07); border-color:rgba(239,68,68,0.2); }
        .hero-del-btn:disabled { opacity:.4; cursor:not-allowed; }

        /* Mobile slide card */
        .hero-slide-card { display:flex; gap:10px; align-items:center; padding:12px; border-radius:12px; background:#FAFAFA; border:1.5px solid ${tk.border}; }
        .hero-slide-card:not(:last-child) { margin-bottom:10px; }
      `}</style>

      <div className="hero-pg">

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:isMobile ? '20px' : 'clamp(18px,3vw,24px)', color:tk.text, marginBottom:'4px' }}>
              🎞️ Hero Carousel
            </h1>
            <p style={{ color:tk.muted, fontSize:'13px' }}>
              Manage homepage hero slides
              {!loading && <span style={{ color:tk.gold, fontWeight:600, marginLeft:'6px' }}>({slides.length} slides)</span>}
            </p>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={fetchSlides} disabled={loading} className="adm-btn-secondary">
              <span style={{ display:'inline-block', animation:loading ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            </button>
            <button onClick={() => { setShowForm(s => !s); if (showForm) resetForm() }} className="adm-btn-primary">
              {showForm ? '✕ Close' : '+ Add Slide'}
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="adm-card" style={{ position:'relative', paddingTop:'24px', overflow:'hidden', animation:'slideDown .3s ease both' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${tk.navy},${tk.gold},${tk.navy})`, backgroundSize:'200% 100%', animation:'shimmer 2.5s linear infinite' }}/>
            <h3 style={{ fontWeight:700, color:tk.text, fontSize:'15px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'8px' }}>
              🎞️ Add Hero Slide
            </h3>
            <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

              {/* Step 1: Type */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                  <div style={{ width:'4px', height:'18px', borderRadius:'2px', background:tk.gold }}/>
                  <span style={{ fontSize:'11px', fontWeight:700, color:tk.faint, textTransform:'uppercase', letterSpacing:'.7px' }}>Step 1 — Choose Type</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:isMobile ? '8px' : '10px' }}>
                  {Object.entries(TYPE_CONFIG).map(([id, c]) => (
                    <button key={id} type="button" disabled={saving}
                      className={`hero-type-btn ${form.type === id ? 'active' : ''}`}
                      onClick={() => handleTypeChange(id)}>
                      <div className="hero-type-icon">{c.icon}</div>
                      <div className="hero-type-label">{c.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Details */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                  <div style={{ width:'4px', height:'18px', borderRadius:'2px', background:tk.gold }}/>
                  <span style={{ fontSize:'11px', fontWeight:700, color:tk.faint, textTransform:'uppercase', letterSpacing:'.7px' }}>Step 2 — Details</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:isMobile ? '1fr' : '1fr auto', gap:'10px', alignItems:'end' }}>
                  <div>
                    <label className="hero-lbl">Title <span className="hero-lbl-req">*</span></label>
                    <input type="text" className="adm-input"
                      placeholder={form.type==='image' ? 'e.g. Welcome to LDCE Portal' : form.type==='video' ? 'e.g. Course Introduction' : 'e.g. Latest Notification'}
                      value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))}
                      disabled={saving} required/>
                  </div>
                  <div style={{ minWidth:isMobile ? 'auto' : '80px' }}>
                    <label className="hero-lbl">Order</label>
                    <input type="number" className="adm-input" value={form.order} min={0}
                      onChange={e => setForm(f => ({ ...f, order:parseInt(e.target.value)||0 }))}
                      disabled={saving}/>
                  </div>
                </div>
              </div>

              {/* Step 3: Upload */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                  <div style={{ width:'4px', height:'18px', borderRadius:'2px', background:tk.gold }}/>
                  <span style={{ fontSize:'11px', fontWeight:700, color:tk.faint, textTransform:'uppercase', letterSpacing:'.7px' }}>Step 3 — Upload Media</span>
                </div>
                <div className={`hero-drop ${form.media ? 'has-file' : ''} ${saving ? 'disabled' : ''}`}>
                  <input type="file" accept={cfg.accept} disabled={saving} onChange={handleFileChange}/>
                  {!form.media ? (
                    <>
                      <div style={{ fontSize:isMobile ? '28px' : '36px', marginBottom:'8px' }}>{form.type==='video' ? '🎬' : '🖼️'}</div>
                      <p style={{ fontSize:'13px', fontWeight:600, color:tk.text, marginBottom:'5px' }}>Click to upload {cfg.label.toLowerCase()}</p>
                      <p style={{ fontSize:'11px', color:tk.faint }}>{cfg.hint}</p>
                    </>
                  ) : (
                    <div style={{ pointerEvents:'none' }}>
                      <div style={{ fontSize:isMobile ? '26px' : '32px', marginBottom:'6px' }}>✅</div>
                      <p style={{ fontSize:'13px', fontWeight:600, color:tk.teal }}>File selected — click to replace</p>
                      <p style={{ fontSize:'11px', color:tk.faint, marginTop:'3px' }}>{form.media.name} ({fmtSize(form.media.size)})</p>
                    </div>
                  )}
                </div>

                {form.mediaPreview && (
                  <div style={{ marginTop:'10px', position:'relative', display:'inline-block' }}>
                    <img src={form.mediaPreview} alt="Preview"
                      style={{ display:'block', height:isMobile ? '80px' : '100px', objectFit:'cover', borderRadius:'10px', border:`1.5px solid ${tk.border}` }}/>
                    <button type="button" onClick={() => setForm(f => ({ ...f, media:null, mediaPreview:'' }))}
                      style={{ position:'absolute', top:'5px', right:'5px', width:'22px', height:'22px', borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'none', color:'#fff', fontSize:'11px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  </div>
                )}

                {form.media && !form.mediaPreview && (
                  <div style={{ marginTop:'10px', display:'inline-flex', alignItems:'center', gap:'8px', padding:'8px 14px', borderRadius:'10px', background:'rgba(27,42,74,0.05)', border:`1.5px solid ${tk.border}` }}>
                    <span style={{ fontSize:'16px' }}>🎬</span>
                    <div>
                      <p style={{ fontSize:'12px', fontWeight:600, color:tk.text }}>{form.media.name}</p>
                      <p style={{ fontSize:'11px', color:tk.faint }}>{fmtSize(form.media.size)}</p>
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, media:null, mediaPreview:'' }))}
                      style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'13px', fontWeight:700 }}>✕</button>
                  </div>
                )}
              </div>

              {saving && <UploadProgress progress={Math.round(progress)} isVideo={form.type==='video'}/>}

              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                <button type="submit" disabled={saving} className="adm-btn-primary"
                  style={{ padding:isMobile ? '10px 20px' : '12px 28px', flex:isMobile ? 1 : 'none' }}>
                  {saving ? (
                    <>
                      <svg style={{ width:'13px',height:'13px',animation:'spin 1s linear infinite',display:'inline-block',marginRight:'6px',verticalAlign:'middle' }}
                        fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Uploading…
                    </>
                  ) : '+ Add Hero Slide'}
                </button>
                <button type="button" disabled={saving} onClick={() => { resetForm(); setShowForm(false) }}
                  className="adm-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Slides list */}
        <div className="hero-table-wrap">
          {loading ? (
            <div style={{ padding:'48px', textAlign:'center' }}>
              <svg style={{ width:'28px',height:'28px',color:tk.gold,animation:'spin 1s linear infinite',margin:'0 auto 10px',display:'block' }}
                fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p style={{ color:tk.faint, fontSize:'13px' }}>Loading slides…</p>
            </div>
          ) : slides.length === 0 ? (
            <div style={{ padding:'52px 24px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'44px' }}>🎞️</span>
              <p style={{ color:tk.muted, fontWeight:600 }}>No hero slides yet</p>
              <p style={{ color:tk.faint, fontSize:'12px' }}>Add your first slide above</p>
            </div>
          ) : isMobile ? (
            /* Mobile card list */
            <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'10px' }}>
              {slides.map(slide => {
                const c = TYPE_CONFIG[slide.type] || TYPE_CONFIG.image
                const id = slide._id || slide.id
                return (
                  <div key={id} className="hero-slide-card">
                    {slide.type === 'video' ? (
                      <div className="hero-thumb-ph">🎬</div>
                    ) : slide.mediaUrl ? (
                      <img src={slide.mediaUrl} alt="" className="hero-thumb"/>
                    ) : (
                      <div className="hero-thumb-ph">{c.icon}</div>
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'13px', fontWeight:600, color:tk.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {slide.title || '—'}
                      </p>
                      <div style={{ display:'flex', gap:'6px', marginTop:'4px', flexWrap:'wrap', alignItems:'center' }}>
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'6px', background:c.badge.bg, color:c.badge.color }}>
                          {c.icon} {c.label}
                        </span>
                        <span style={{ fontSize:'10px', color:slide.isActive ? tk.teal : tk.faint, fontWeight:600 }}>
                          #{slide.order} {slide.isActive ? '● Active' : '○ Hidden'}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(id)} disabled={deleting === id}
                      style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', color:'#ef4444', padding:'7px 10px', borderRadius:'9px', cursor:'pointer', fontSize:'14px', flexShrink:0, opacity:deleting===id ? 0.5 : 1 }}>
                      🗑️
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Desktop/tablet table */
            <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <table className="hero-table" style={{ minWidth:'500px' }}>
                <thead>
                  <tr>
                    <th>Slide</th>
                    <th>Type</th>
                    {!isTablet && <th>Storage</th>}
                    <th style={{ textAlign:'center' }}>Order</th>
                    <th>Status</th>
                    <th style={{ textAlign:'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slides.map(slide => {
                    const c  = TYPE_CONFIG[slide.type] || TYPE_CONFIG.image
                    const id = slide._id || slide.id
                    return (
                      <tr key={id}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            {slide.type === 'video' ? (
                              <div className="hero-thumb-ph">🎬</div>
                            ) : slide.mediaUrl ? (
                              <img src={slide.mediaUrl} alt="" className="hero-thumb"/>
                            ) : (
                              <div className="hero-thumb-ph">{c.icon}</div>
                            )}
                            <p style={{ fontSize:'13px', fontWeight:600, color:tk.text, maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {slide.title || '—'}
                            </p>
                          </div>
                        </td>
                        <td>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'8px', fontSize:'11px', fontWeight:700, background:c.badge.bg, color:c.badge.color }}>
                            {c.icon} {c.label}
                          </span>
                        </td>
                        {!isTablet && (
                          <td>
                            <span style={{ fontSize:'11px', fontWeight:600, color:slide.type==='video' ? tk.teal : '#3B82F6' }}>
                              {slide.type==='video' ? '☁️ Cloud' : '🖼️ CDN'}
                            </span>
                          </td>
                        )}
                        <td style={{ textAlign:'center' }}>
                          <span style={{ background:'rgba(27,42,74,0.05)', borderRadius:'6px', padding:'3px 10px', fontSize:'12px', fontWeight:600, color:tk.muted }}>
                            {slide.order}
                          </span>
                        </td>
                        <td>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:700, color:slide.isActive ? tk.teal : tk.faint }}>
                            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:slide.isActive ? tk.teal : tk.faint }}/>
                            {slide.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td style={{ textAlign:'right' }}>
                          <button onClick={() => handleDelete(id)} disabled={deleting===id} className="hero-del-btn">
                            {deleting===id ? (
                              <>
                                <svg style={{ width:'11px',height:'11px',animation:'spin 1s linear infinite',display:'inline-block',marginRight:'4px',verticalAlign:'middle' }}
                                  fill="none" viewBox="0 0 24 24">
                                  <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                                Deleting…
                              </>
                            ) : '🗑️ Delete'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  )
}