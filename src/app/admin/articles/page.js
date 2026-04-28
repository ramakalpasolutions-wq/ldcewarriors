// src/app/admin/articles/page.js
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

const C = {
  red:'#C94A44', navy:'#1B2A4A', gold:'#E8A838',
  teal:'#2A9D8F', green:'#16a34a',
  bg:'#F8F7F4', card:'#FFFFFF', border:'#E5E7EB',
  text:'#1A1D23', muted:'#6B7280', faint:'#9CA3AF',
}

const EMPTY_FORM = {
  title:'', content:'', excerpt:'', category:'',
  showOnHomepage:false, showInLiveScroll:false,
  thumbnail:null, thumbnailPreview:'', docxFile:null, docxFileName:'',
}

export default function AdminArticlesPage() {
  const [articles,   setArticles  ] = useState([])
  const [loading,    setLoading   ] = useState(true)
  const [showForm,   setShowForm  ] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving,     setSaving    ] = useState(false)
  const [deleting,   setDeleting  ] = useState(null)
  const [uploadMode, setUploadMode] = useState('docx')
  const [form,       setForm      ] = useState(EMPTY_FORM)
  const [search,     setSearch    ] = useState('')
  const [filter,     setFilter    ] = useState('all')
  const [isMobile,   setIsMobile  ] = useState(false)
  const [isTablet,   setIsTablet  ] = useState(false)

  const docxRef = useRef(null)
  const thumbRef = useRef(null)
  const formRef  = useRef(null)

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/articles', { credentials:'include' })
      const data = await res.json()
      if (data.success) setArticles(data.articles || [])
      else toast.error(data.error || 'Failed to load articles')
    } catch { toast.error('Failed to fetch articles') }
    setLoading(false)
  }, [])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  function resetForm() {
    setForm(EMPTY_FORM); setUploadMode('docx'); setEditTarget(null)
    if (docxRef.current)  docxRef.current.value  = ''
    if (thumbRef.current) thumbRef.current.value = ''
  }

  function openEdit(article) {
    setEditTarget(article)
    setForm({
      title:            article.title         || '',
      content:          article.manualContent || '',
      excerpt:          article.excerpt       || '',
      category:         article.category      || '',
      showOnHomepage:   article.showOnHomepage   || false,
      showInLiveScroll: article.showInLiveScroll || false,
      thumbnail:        null,
      thumbnailPreview: article.thumbnail || '',
      docxFile:         null,
      docxFileName:     article.docxUrl ? '(existing file)' : '',
    })
    setUploadMode(article.contentType === 'docx' ? 'docx' : 'manual')
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 100)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    const isEdit = !!editTarget
    if (!isEdit) {
      if (uploadMode==='docx'   && !form.docxFile)     { toast.error('Please upload a .docx file'); return }
      if (uploadMode==='manual' && !form.content.trim()){ toast.error('Content is required');       return }
    }
    setSaving(true)
    try {
      if (isEdit) {
        const hasNewDocx    = uploadMode==='docx'   && form.docxFile
        const hasNewThumb   = !!form.thumbnail
        const hasNewContent = uploadMode==='manual' && form.content.trim()
        if (hasNewDocx || hasNewThumb) {
          const fd = new FormData()
          fd.append('id', editTarget._id)
          fd.append('title', form.title.trim())
          fd.append('excerpt', form.excerpt.trim())
          fd.append('category', form.category.trim())
          fd.append('showOnHomepage', form.showOnHomepage.toString())
          fd.append('showInLiveScroll', form.showInLiveScroll.toString())
          if (hasNewDocx)  fd.append('docxFile', form.docxFile)
          if (hasNewThumb) fd.append('thumbnail', form.thumbnail)
          const res  = await fetch('/api/admin/articles', { method:'PATCH', credentials:'include', body:fd })
          const data = await res.json()
          if (!data.success) throw new Error(data.error || 'Update failed')
        } else {
          const body = {
            id: editTarget._id, title: form.title.trim(),
            excerpt: form.excerpt.trim() || null,
            category: form.category.trim() || null,
            showOnHomepage: form.showOnHomepage,
            showInLiveScroll: form.showInLiveScroll,
          }
          if (hasNewContent) { body.manualContent = form.content; body.contentType = 'manual' }
          const res  = await fetch('/api/admin/articles', {
            method:'PUT', credentials:'include',
            headers:{ 'Content-Type':'application/json' },
            body:JSON.stringify(body),
          })
          const data = await res.json()
          if (!data.success) throw new Error(data.error || 'Update failed')
        }
        toast.success('Article updated!')
      } else {
        const fd = new FormData()
        fd.append('title', form.title.trim())
        fd.append('excerpt', form.excerpt.trim())
        fd.append('category', form.category.trim())
        fd.append('showOnHomepage', form.showOnHomepage.toString())
        fd.append('showInLiveScroll', form.showInLiveScroll.toString())
        if (uploadMode==='docx' && form.docxFile) fd.append('docxFile', form.docxFile)
        else fd.append('content', form.content)
        if (form.thumbnail) fd.append('thumbnail', form.thumbnail)
        const res  = await fetch('/api/admin/articles', { method:'POST', credentials:'include', body:fd })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to create article')
        toast.success('Article published!')
      }
      resetForm(); setShowForm(false); await fetchArticles()
    } catch (err) { toast.error(err.message || 'Failed to save article') }
    setSaving(false)
  }

  async function toggleField(id, field) {
    const article = articles.find(a => a._id === id)
    if (!article) return
    try {
      const res  = await fetch('/api/admin/articles', {
        method:'PUT', credentials:'include',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ id, [field]:!article[field] }),
      })
      const data = await res.json()
      if (data.success) {
        setArticles(prev => prev.map(a => a._id===id ? { ...a, [field]:!a[field] } : a))
        toast.success('Updated')
      } else toast.error(data.error || 'Update failed')
    } catch { toast.error('Failed to update') }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this article permanently?')) return
    setDeleting(id)
    try {
      const res  = await fetch(`/api/admin/articles?id=${id}`, { method:'DELETE', credentials:'include' })
      const data = await res.json()
      if (data.success) {
        setArticles(prev => prev.filter(a => a._id !== id))
        toast.success('Article deleted')
        if (editTarget?._id === id) { resetForm(); setShowForm(false) }
      } else toast.error(data.error || 'Delete failed')
    } catch { toast.error('Failed to delete') }
    setDeleting(null)
  }

  function handleDocxSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const name = file.name || ''
    if (!name.endsWith('.docx') && !name.endsWith('.doc')) { toast.error('Only .docx files'); e.target.value=''; return }
    if (file.size > 20*1024*1024) { toast.error('DOCX must be under 20MB'); e.target.value=''; return }
    setForm(prev => ({ ...prev, docxFile:file, docxFileName:name }))
    toast.success(`File selected: ${name}`)
  }

  const displayed = articles.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.title.toLowerCase().includes(q) || (a.category||'').toLowerCase().includes(q)
    const matchFilter =
      filter==='all'      ? true :
      filter==='homepage' ? a.showOnHomepage :
      filter==='live'     ? a.showInLiveScroll :
      filter==='docx'     ? a.contentType==='docx' :
      filter==='manual'   ? a.contentType!=='docx' : true
    return matchSearch && matchFilter
  })

  const isEdit = !!editTarget

  const FILTERS = [
    { k:'all',      label:`All (${articles.length})` },
    { k:'homepage', label:`Home (${articles.filter(a=>a.showOnHomepage).length})` },
    { k:'live',     label:`Live (${articles.filter(a=>a.showInLiveScroll).length})` },
    { k:'docx',     label:`DOCX (${articles.filter(a=>a.contentType==='docx').length})` },
    { k:'manual',   label:`Manual (${articles.filter(a=>a.contentType!=='docx').length})` },
  ]

  return (
    <>
      <style>{`
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

        .aa-tog { width:30px; height:30px; border-radius:8px; font-size:14px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; margin:0 auto; transition:all .2s; }
        .aa-tog-on  { background:rgba(22,163,74,.12); color:#16a34a; }
        .aa-tog-off { background:#F3F4F6; color:#D1D5DB; }
        .aa-tog:hover { transform:scale(1.12); }

        .aa-del { font-size:11px; color:#ef4444; font-weight:600; background:none; border:none; cursor:pointer; padding:5px 9px; border-radius:7px; transition:all .2s; }
        .aa-del:hover:not(:disabled) { background:rgba(239,68,68,.09); }
        .aa-del:disabled { opacity:.35; cursor:not-allowed; }

        .aa-edit-btn { font-size:11px; color:${C.navy}; font-weight:600; background:none; border:1px solid ${C.border}; cursor:pointer; padding:5px 10px; border-radius:7px; transition:all .2s; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
        .aa-edit-btn:hover { background:rgba(27,42,74,.06); border-color:rgba(27,42,74,.2); }
        .aa-edit-btn.active { background:${C.gold}; color:${C.navy}; border-color:${C.gold}; }

        .aa-mode { padding:8px 12px; border-radius:10px; font-size:12px; font-weight:600; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; }
        .aa-mode-on  { background:${C.red}; color:#fff; box-shadow:0 2px 8px rgba(201,74,68,.25); }
        .aa-mode-off { background:#F3F4F6; color:#6B7280; border:1px solid ${C.border}; }
        .aa-mode-off:hover { background:#fff; color:${C.red}; border-color:rgba(201,74,68,.2); }

        .aa-drop { border:2px dashed rgba(201,74,68,.25); border-radius:14px; padding:${isMobile ? '20px 14px' : '28px 20px'}; text-align:center; cursor:pointer; transition:all .2s; background:rgba(201,74,68,.02); }
        .aa-drop:hover { border-color:rgba(201,74,68,.5); background:rgba(201,74,68,.05); }
        .aa-drop.filled { border-style:solid; border-color:rgba(34,197,94,.4); background:rgba(34,197,94,.04); }
        .aa-drop.has-existing { border-style:solid; border-color:rgba(59,130,246,.3); background:rgba(59,130,246,.04); }

        .aa-chk { display:flex; align-items:center; gap:8px; cursor:pointer; }
        .aa-chk input { accent-color:${C.red}; width:16px; height:16px; cursor:pointer; }
        .aa-chk span { font-size:${isMobile ? '12px' : '13px'}; color:${C.muted}; font-weight:500; }

        .aa-fp { padding:${isMobile ? '5px 10px' : '6px 12px'}; border-radius:999px; font-size:${isMobile ? '11px' : '12px'}; font-weight:600; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; white-space:nowrap; }
        .aa-fp-on  { background:${C.navy}; color:#fff; }
        .aa-fp-off { background:#F3F4F6; color:${C.muted}; border:1px solid ${C.border}; }
        .aa-fp-off:hover { background:#fff; color:${C.navy}; border-color:rgba(27,42,74,.2); }

        .aa-inp { width:100%; padding:10px 13px; border-radius:10px; border:1px solid ${C.border}; font-size:${isMobile ? '16px' : '13px'}; color:${C.text}; font-family:'DM Sans',sans-serif; background:#FAFAFA; transition:border .2s,box-shadow .2s; outline:none; box-sizing:border-box; }
        .aa-inp:focus { border-color:rgba(201,74,68,.4); box-shadow:0 0 0 3px rgba(201,74,68,.08); background:#fff; }
        .aa-inp::placeholder { color:${C.faint}; }

        .form-card { background:${C.card}; border:1px solid ${C.border}; border-radius:${isMobile ? '14px' : '20px'}; padding:${isMobile ? '14px' : '20px'}; box-shadow:0 4px 24px rgba(0,0,0,0.06); animation:fadeIn 0.3s ease; position:relative; overflow:hidden; }
        .form-card.edit-mode { border-color:rgba(232,168,56,0.35); }

        .aa-tr { transition:background .15s; }
        .aa-tr:hover { background:rgba(27,42,74,0.02); }
        .aa-tr.editing { background:rgba(232,168,56,0.05) !important; }

        /* filter scroll on mobile */
        .aa-filter-track { overflow-x:auto; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
        .aa-filter-track::-webkit-scrollbar { display:none; }
        .aa-filter-inner { display:flex; gap:6px; width:max-content; }

        /* Mobile article card */
        .aa-mob-card { background:${C.card}; border:1.5px solid ${C.border}; border-radius:14px; padding:12px; display:flex; flex-direction:column; gap:10px; transition:border-color .2s; }
        .aa-mob-card.editing { border-color:rgba(232,168,56,0.4); border-left:3px solid ${C.gold}; background:rgba(232,168,56,0.02); }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', gap:isMobile ? '14px' : '22px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:isMobile ? '20px' : '24px', color:C.text, marginBottom:'4px' }}>Articles</h1>
            <p style={{ color:C.muted, fontSize:'13px' }}>
              Create and manage articles
              {!loading && <span style={{ color:C.red, fontWeight:600, marginLeft:'6px' }}>({articles.length} total)</span>}
            </p>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={fetchArticles} disabled={loading} className="adm-btn-secondary">🔄</button>
            <button
              onClick={() => { if (showForm) { resetForm(); setShowForm(false) } else { resetForm(); setShowForm(true) } }}
              className="adm-btn-primary"
              style={isEdit && showForm ? { background:C.gold, color:C.navy } : {}}
            >
              {showForm ? (isEdit ? '× Cancel Edit' : '× Cancel') : '+ New Article'}
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        {!loading && articles.length > 0 && (
          <div style={{ display:'flex', flexDirection:isMobile ? 'column' : 'row', gap:'10px', padding:'12px 14px', borderRadius:'14px', background:C.card, border:`1px solid ${C.border}` }}>
            <div style={{ position:'relative', flex:1 }}>
              <span style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:C.faint, fontSize:'14px', pointerEvents:'none' }}>🔍</span>
              <input className="aa-inp" placeholder="Search articles..." value={search}
                onChange={e => setSearch(e.target.value)} style={{ paddingLeft:'34px' }}/>
            </div>
            <div className="aa-filter-track">
              <div className="aa-filter-inner">
                {FILTERS.map(f => (
                  <button key={f.k} onClick={() => setFilter(f.k)}
                    className={`aa-fp ${filter===f.k ? 'aa-fp-on' : 'aa-fp-off'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div ref={formRef} className={`form-card ${isEdit ? 'edit-mode' : ''}`}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:isEdit ? `linear-gradient(90deg,transparent,${C.gold},transparent)` : `linear-gradient(90deg,transparent,${C.red},transparent)`, borderRadius:'14px 14px 0 0' }}/>

            {isEdit && (
              <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', background:'rgba(232,168,56,0.08)', border:'1px solid rgba(232,168,56,0.2)', marginBottom:'14px' }}>
                <span>✏️</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'11px', fontWeight:700, color:'#B87A00' }}>EDITING</p>
                  <p style={{ fontSize:'11px', color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>"{editTarget.title}"</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(false) }} style={{ background:'none', border:'none', cursor:'pointer', color:C.faint, fontSize:'18px' }}>×</button>
              </div>
            )}

            <h2 style={{ fontWeight:700, color:C.text, fontSize:'14px', marginBottom:'14px' }}>
              {isEdit ? '✏️ Edit Article' : '✍️ Create New Article'}
            </h2>

            <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

              {/* Title + Category */}
              <div style={{ display:'grid', gridTemplateColumns:isMobile ? '1fr' : 'repeat(auto-fit,minmax(180px,1fr))', gap:'10px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'12px', color:C.muted, marginBottom:'5px', fontWeight:600 }}>
                    Title <span style={{ color:C.red }}>*</span>
                  </label>
                  <input className="aa-inp" type="text" placeholder="Article title"
                    value={form.title} onChange={e => setForm({...form, title:e.target.value})}
                    required disabled={saving}/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', color:C.muted, marginBottom:'5px', fontWeight:600 }}>Category</label>
                  <input className="aa-inp" type="text" placeholder="e.g. Study Material"
                    value={form.category} onChange={e => setForm({...form, category:e.target.value})}
                    disabled={saving}/>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label style={{ display:'block', fontSize:'12px', color:C.muted, marginBottom:'5px', fontWeight:600 }}>
                  Excerpt <span style={{ fontSize:'11px', fontWeight:400 }}>(auto from DOCX if empty)</span>
                </label>
                <input className="aa-inp" type="text" placeholder="Short summary..."
                  value={form.excerpt} onChange={e => setForm({...form, excerpt:e.target.value})} disabled={saving}/>
              </div>

              {/* Content mode */}
              <div>
                <label style={{ display:'block', fontSize:'12px', color:C.muted, marginBottom:'8px', fontWeight:600 }}>
                  Content Source <span style={{ color:C.red }}>*</span>
                </label>
                <div style={{ display:'flex', gap:'8px', marginBottom:'10px', flexWrap:'wrap' }}>
                  <button type="button" onClick={() => setUploadMode('docx')}
                    className={`aa-mode ${uploadMode==='docx' ? 'aa-mode-on' : 'aa-mode-off'}`}>📄 Upload DOCX</button>
                  <button type="button" onClick={() => setUploadMode('manual')}
                    className={`aa-mode ${uploadMode==='manual' ? 'aa-mode-on' : 'aa-mode-off'}`}>✏️ Write Manually</button>
                </div>

                {uploadMode==='docx' && (
                  <div className={`aa-drop ${form.docxFile ? 'filled' : isEdit && editTarget?.docxUrl ? 'has-existing' : ''}`}
                    onClick={() => !saving && docxRef.current?.click()}>
                    {form.docxFile ? (
                      <div>
                        <div style={{ fontSize:'26px', marginBottom:'6px' }}>✅</div>
                        <p style={{ color:C.green, fontWeight:700, fontSize:'13px' }}>{form.docxFileName}</p>
                        <p style={{ color:C.muted, fontSize:'11px', marginTop:'2px' }}>{(form.docxFile.size/1024).toFixed(1)} KB</p>
                      </div>
                    ) : isEdit && editTarget?.docxUrl ? (
                      <div>
                        <div style={{ fontSize:'26px', marginBottom:'6px' }}>📄</div>
                        <p style={{ color:'#2563eb', fontWeight:700, fontSize:'13px' }}>Existing DOCX attached</p>
                        <p style={{ color:C.muted, fontSize:'11px', marginBottom:'6px' }}>Click to replace</p>
                        <a href={editTarget.docxUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize:'11px', color:'#3b82f6', textDecoration:'none' }}
                          onClick={e => e.stopPropagation()}>↓ Download current</a>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize:'26px', marginBottom:'6px' }}>📄</div>
                        <p style={{ color:C.text, fontWeight:600, fontSize:'13px' }}>Click to upload .docx</p>
                        <p style={{ color:C.faint, fontSize:'11px', marginTop:'2px' }}>Max 20MB</p>
                        {isEdit && <p style={{ color:C.faint, fontSize:'11px', marginTop:'4px' }}>Leave empty to keep existing</p>}
                      </div>
                    )}
                    <input ref={docxRef} type="file"
                      accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleDocxSelect} style={{ display:'none' }} disabled={saving}/>
                  </div>
                )}

                {uploadMode==='manual' && (
                  <div>
                    <textarea className="aa-inp" value={form.content}
                      onChange={e => setForm({...form, content:e.target.value})}
                      rows={isMobile ? 6 : 10}
                      style={{ resize:'vertical', fontFamily:'monospace', fontSize:'12px', minHeight:isMobile ? '140px' : '200px' }}
                      placeholder="Write HTML content here..." disabled={saving}/>
                    {isEdit && <p style={{ fontSize:'11px', color:C.faint, marginTop:'4px' }}>💡 Leave empty to keep existing content</p>}
                  </div>
                )}
              </div>

              {/* Thumbnail */}
              <div>
                <label style={{ display:'block', fontSize:'12px', color:C.muted, marginBottom:'5px', fontWeight:600 }}>
                  Thumbnail {isEdit && editTarget?.thumbnail && <span style={{ fontWeight:400 }}>(upload new to replace)</span>}
                </label>
                <div style={{ display:'flex', gap:'10px', alignItems:'flex-start', flexWrap:'wrap' }}>
                  {form.thumbnailPreview && (
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <img src={form.thumbnailPreview} alt="Preview"
                        style={{ height:'60px', width:'90px', borderRadius:'8px', objectFit:'cover', border:`2px solid ${form.thumbnail ? C.green : C.border}` }}/>
                      {form.thumbnail && (
                        <span style={{ position:'absolute', top:'-7px', right:'-7px', background:C.green, color:'#fff', borderRadius:'50%', width:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700 }}>✓</span>
                      )}
                    </div>
                  )}
                  <div style={{ flex:1, minWidth:'140px' }}>
                    <input ref={thumbRef} type="file" accept="image/*" className="aa-inp"
                      style={{ fontSize:'12px' }}
                      onChange={e => {
                        const f = e.target.files[0]
                        if (!f) return
                        if (f.size > 5*1024*1024) { toast.error('Image under 5MB'); return }
                        setForm({...form, thumbnail:f, thumbnailPreview:URL.createObjectURL(f)})
                      }} disabled={saving}/>
                    <p style={{ fontSize:'11px', color:C.faint, marginTop:'4px' }}>JPG/PNG/WebP • Max 5MB</p>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div style={{ display:'flex', gap:isMobile ? '12px' : '20px', flexWrap:'wrap', padding:'12px 14px', borderRadius:'12px', background:'rgba(27,42,74,0.03)', border:`1px solid ${C.border}` }}>
                <label className="aa-chk">
                  <input type="checkbox" checked={form.showOnHomepage}
                    onChange={e => setForm({...form, showOnHomepage:e.target.checked})} disabled={saving}/>
                  <span>🏠 {isMobile ? 'Homepage' : 'Show on Homepage'}</span>
                </label>
                <label className="aa-chk">
                  <input type="checkbox" checked={form.showInLiveScroll}
                    onChange={e => setForm({...form, showInLiveScroll:e.target.checked})} disabled={saving}/>
                  <span>📡 {isMobile ? 'Live Scroll' : 'Show in Live Scroll'}</span>
                </label>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', paddingTop:'4px' }}>
                <button type="submit" disabled={saving} className="adm-btn-primary"
                  style={{ flex:isMobile ? 1 : 'none', padding:'11px 20px', justifyContent:'center',
                    ...(isEdit ? { background:C.gold, color:C.navy } : {}) }}>
                  {saving ? (
                    <span style={{ display:'flex', alignItems:'center', gap:'6px', justifyContent:'center' }}>
                      <svg style={{ width:'13px',height:'13px',animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {isEdit ? 'Saving…' : 'Publishing…'}
                    </span>
                  ) : isEdit ? '💾 Save Changes' : '📤 Publish'}
                </button>
                <button type="button" disabled={saving}
                  onClick={() => { resetForm(); setShowForm(false) }}
                  className="adm-btn-secondary">Cancel</button>
                {isEdit && (
                  <button type="button" disabled={saving || deleting===editTarget?._id}
                    onClick={() => handleDelete(editTarget._id)}
                    style={{ marginLeft:isMobile ? 0 : 'auto', padding:'11px 14px', borderRadius:'10px', background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', cursor:'pointer', fontSize:'12px', fontWeight:600 }}>
                    🗑 Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Articles List */}
        {loading ? (
          <div className="adm-spinner">
            <svg style={{ width:'24px',height:'24px',animation:'spin 1s linear infinite',color:C.red,marginBottom:'10px' }} fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p style={{ color:C.faint, fontSize:'13px' }}>Loading articles...</p>
          </div>
        ) : isMobile ? (
          /* ── Mobile card list ── */
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {(search || filter!=='all') && (
              <p style={{ fontSize:'12px', color:C.muted }}>
                Showing <strong>{displayed.length}</strong> of <strong>{articles.length}</strong>
              </p>
            )}
            {displayed.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 20px', borderRadius:'14px', background:C.card, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:'36px', marginBottom:'10px' }}>{search ? '🔍' : '📰'}</div>
                <p style={{ color:C.muted, fontWeight:600 }}>{search ? `No results for "${search}"` : 'No articles yet'}</p>
              </div>
            ) : displayed.map(article => {
              const isEditing = editTarget?._id===article._id && showForm
              return (
                <div key={article._id} className={`aa-mob-card ${isEditing ? 'editing' : ''}`}>
                  <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                    {article.thumbnail ? (
                      <img src={article.thumbnail} alt="" style={{ width:'50px', height:'36px', borderRadius:'7px', objectFit:'cover', flexShrink:0 }}/>
                    ) : (
                      <div style={{ width:'50px', height:'36px', borderRadius:'7px', background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>📰</div>
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'13px', fontWeight:700, color:isEditing ? '#B87A00' : C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {article.title}
                      </p>
                      <div style={{ display:'flex', gap:'6px', marginTop:'3px', flexWrap:'wrap', alignItems:'center' }}>
                        <span style={{ fontSize:'10px', color:C.faint }}>{new Date(article.createdAt).toLocaleDateString('en-IN')}</span>
                        {article.category && <span style={{ fontSize:'10px', color:C.gold, fontWeight:600 }}>• {article.category}</span>}
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 7px', borderRadius:'5px', background:article.contentType==='docx' ? 'rgba(59,130,246,0.1)' : '#F3F4F6', color:article.contentType==='docx' ? '#2563eb' : C.muted }}>
                          {article.contentType==='docx' ? '📄 DOCX' : '✏️ Manual'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'6px' }}>
                    <button onClick={() => toggleField(article._id, 'showOnHomepage')}
                      style={{ flex:1, padding:'7px', borderRadius:'8px', cursor:'pointer', border:`1px solid ${article.showOnHomepage ? 'rgba(22,163,74,0.25)' : C.border}`, background:article.showOnHomepage ? 'rgba(22,163,74,0.08)' : '#F9FAFB', color:article.showOnHomepage ? '#16a34a' : C.faint, fontSize:'11px', fontWeight:700 }}>
                      🏠 {article.showOnHomepage ? 'On' : 'Off'}
                    </button>
                    <button onClick={() => toggleField(article._id, 'showInLiveScroll')}
                      style={{ flex:1, padding:'7px', borderRadius:'8px', cursor:'pointer', border:`1px solid ${article.showInLiveScroll ? 'rgba(22,163,74,0.25)' : C.border}`, background:article.showInLiveScroll ? 'rgba(22,163,74,0.08)' : '#F9FAFB', color:article.showInLiveScroll ? '#16a34a' : C.faint, fontSize:'11px', fontWeight:700 }}>
                      📡 {article.showInLiveScroll ? 'On' : 'Off'}
                    </button>
                    <button onClick={() => { if (isEditing) { resetForm(); setShowForm(false) } else openEdit(article) }}
                      className={`aa-edit-btn ${isEditing ? 'active' : ''}`} style={{ flex:1, justifyContent:'center', padding:'7px' }}>
                      {isEditing ? '× Cancel' : '✏️ Edit'}
                    </button>
                    <button onClick={() => handleDelete(article._id)} disabled={deleting===article._id}
                      style={{ padding:'7px 12px', borderRadius:'8px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.15)', color:'#ef4444', cursor:'pointer', fontSize:'13px', opacity:deleting===article._id ? 0.5 : 1 }}>
                      {deleting===article._id ? '⏳' : '🗑'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ── Desktop/Tablet table ── */
          <div className="adm-table-wrap">
            {(search || filter!=='all') && (
              <div style={{ padding:'10px 16px', fontSize:'12px', color:C.muted, borderBottom:`1px solid ${C.border}` }}>
                Showing <strong style={{ color:C.text }}>{displayed.length}</strong> of <strong style={{ color:C.text }}>{articles.length}</strong>
              </div>
            )}
            <div style={{ overflowX:'auto' }}>
              <table className="adm-table" style={{ minWidth:isTablet ? '580px' : '760px' }}>
                <thead>
                  <tr>
                    <th style={{ width:'38%' }}>Article</th>
                    <th>Source</th>
                    {!isTablet && <th>Category</th>}
                    <th style={{ textAlign:'center' }}>Home</th>
                    <th style={{ textAlign:'center' }}>Live</th>
                    {!isTablet && <th>Views</th>}
                    <th style={{ textAlign:'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(article => {
                    const isEditing = editTarget?._id===article._id && showForm
                    return (
                      <tr key={article._id} className={`aa-tr ${isEditing ? 'editing' : ''}`}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            {article.thumbnail ? (
                              <img src={article.thumbnail} alt="" style={{ width:'44px', height:'32px', borderRadius:'7px', objectFit:'cover', flexShrink:0 }}/>
                            ) : (
                              <div style={{ width:'44px', height:'32px', borderRadius:'7px', background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>📰</div>
                            )}
                            <div style={{ minWidth:0 }}>
                              <p style={{ fontSize:'13px', fontWeight:600, color:isEditing ? '#B87A00' : C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:isTablet ? '160px' : '220px' }}>
                                {article.title}
                              </p>
                              <p style={{ color:C.faint, fontSize:'11px' }}>{new Date(article.createdAt).toLocaleDateString('en-IN')}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          {article.contentType==='docx'
                            ? <span className="adm-badge" style={{ background:'rgba(59,130,246,0.1)', color:'#2563eb', border:'1px solid rgba(59,130,246,0.15)' }}>📄 DOCX</span>
                            : <span className="adm-badge" style={{ background:'#F3F4F6', color:C.muted, border:`1px solid ${C.border}` }}>✏️ Manual</span>}
                        </td>
                        {!isTablet && (
                          <td>
                            {article.category
                              ? <span className="adm-badge" style={{ background:'rgba(232,168,56,0.1)', color:'#B87A00', border:'1px solid rgba(232,168,56,0.2)' }}>{article.category}</span>
                              : <span style={{ color:C.faint }}>—</span>}
                          </td>
                        )}
                        <td style={{ textAlign:'center' }}>
                          <button onClick={() => toggleField(article._id, 'showOnHomepage')}
                            className={`aa-tog ${article.showOnHomepage ? 'aa-tog-on' : 'aa-tog-off'}`}>
                            {article.showOnHomepage ? '✓' : '○'}
                          </button>
                        </td>
                        <td style={{ textAlign:'center' }}>
                          <button onClick={() => toggleField(article._id, 'showInLiveScroll')}
                            className={`aa-tog ${article.showInLiveScroll ? 'aa-tog-on' : 'aa-tog-off'}`}>
                            {article.showInLiveScroll ? '✓' : '○'}
                          </button>
                        </td>
                        {!isTablet && <td style={{ color:C.muted, fontSize:'13px' }}>{article.views || 0}</td>}
                        <td>
                          <div style={{ display:'flex', gap:'6px', justifyContent:'flex-end', alignItems:'center' }}>
                            <button onClick={() => { if (isEditing) { resetForm(); setShowForm(false) } else openEdit(article) }}
                              className={`aa-edit-btn ${isEditing ? 'active' : ''}`}>
                              {isEditing ? '× Cancel' : '✏️ Edit'}
                            </button>
                            <button onClick={() => handleDelete(article._id)} disabled={deleting===article._id} className="aa-del">
                              {deleting===article._id ? '⏳' : '🗑'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {displayed.length===0 && (
                    <tr><td colSpan={isTablet ? 5 : 7}>
                      <div className="adm-empty">
                        <div style={{ fontSize:'36px', marginBottom:'10px' }}>{search ? '🔍' : '📰'}</div>
                        <p style={{ color:C.muted, fontSize:'14px', fontWeight:600 }}>{search ? `No articles match "${search}"` : 'No articles yet'}</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}