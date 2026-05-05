// src/app/admin/topics/page.js
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

export default function AdminTopicsPage() {
  const [topics,      setTopics     ] = useState([])
  const [loading,     setLoading    ] = useState(true)
  const [showForm,    setShowForm   ] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', thumbnail: '', thumbnailPublicId: '' })
  const [saving,      setSaving     ] = useState(false)
  const [deleting,    setDeleting   ] = useState(null)
  const [uploading,   setUploading  ] = useState(false)
  const [previewUrl,  setPreviewUrl ] = useState('')
  const [editingId,   setEditingId  ] = useState(null)
  const [reorderMode, setReorderMode] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const fileInputRef   = useRef(null)
  // Use a ref to track the dragged item's _id (stable across re-renders)
  const dragId         = useRef(null)
  // Keep a mutable copy of topics array for drag so we don't fight React batching
  const topicsRef      = useRef([])

  // Keep topicsRef in sync
  useEffect(() => { topicsRef.current = topics }, [topics])

  const fetchTopics = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/topics')
      const data = await res.json()
      if (data.success) setTopics(data.topics)
      else toast.error(data.error || 'Failed to load topics')
    } catch { toast.error('Failed to fetch topics') }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTopics() }, [fetchTopics])

  function resetForm() {
    setForm({ name: '', description: '', thumbnail: '', thumbnailPublicId: '' })
    setPreviewUrl('')
    setEditingId(null)
    setShowForm(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) {
      toast.error('Use JPEG, PNG, WebP, or GIF'); return
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return }
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res  = await fetch('/api/admin/topics/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        setForm(prev => ({ ...prev, thumbnail: data.url, thumbnailPublicId: data.publicId }))
        setPreviewUrl(data.url)
        toast.success('Thumbnail uploaded!')
      } else { toast.error(data.error || 'Upload failed'); setPreviewUrl('') }
    } catch { toast.error('Upload failed'); setPreviewUrl('') }
    setUploading(false)
  }

  function startEdit(topic) {
    setReorderMode(false)
    setEditingId(topic._id)
    setForm({
      name: topic.name || '',
      description: topic.description || '',
      thumbnail: topic.thumbnail || '',
      thumbnailPublicId: topic.thumbnailPublicId || '',
    })
    setPreviewUrl(topic.thumbnail || '')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Topic name is required'); return }
    setSaving(true)
    try {
      const isEdit = !!editingId
      const body   = isEdit
        ? { id: editingId, name: form.name.trim(), description: form.description.trim(), thumbnail: form.thumbnail||null, thumbnailPublicId: form.thumbnailPublicId||null }
        : { name: form.name.trim(), description: form.description.trim(), thumbnail: form.thumbnail||null, thumbnailPublicId: form.thumbnailPublicId||null }
      const res  = await fetch('/api/admin/topics', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(isEdit ? 'Topic updated!' : 'Topic created!')
        resetForm(); await fetchTopics()
      } else toast.error(data.error || 'Failed to save topic')
    } catch { toast.error('Failed to save topic') }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm("Delete this topic? Videos won't be deleted but will lose their topic tag.")) return
    setDeleting(id)
    try {
      const res  = await fetch(`/api/admin/topics?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setTopics(prev => prev.filter(t => t._id !== id))
        toast.success('Topic deleted')
        if (editingId === id) resetForm()
      } else toast.error(data.error || 'Delete failed')
    } catch { toast.error('Failed to delete topic') }
    setDeleting(null)
  }

  /* ═══════════════════════════════════════
     DRAG & DROP  — id-based, not index-based
     Using _id avoids index-drift on re-render
  ═══════════════════════════════════════ */
  function onDragStart(e, id) {
    dragId.current = id
    e.dataTransfer.effectAllowed = 'move'
    // Invisible ghost image so browser doesn't show default clone
    const ghost = document.createElement('div')
    ghost.style.cssText = 'position:fixed;top:-9999px;opacity:0;'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    requestAnimationFrame(() => document.body.removeChild(ghost))
  }

  function onDragOver(e, overIdx) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!dragId.current) return

    const current = topicsRef.current
    const fromIdx = current.findIndex(t => t._id === dragId.current)
    if (fromIdx === -1 || fromIdx === overIdx) return

    // Reorder immutably
    const next = [...current]
    const [item] = next.splice(fromIdx, 1)
    next.splice(overIdx, 0, item)

    topicsRef.current = next   // update ref immediately
    setTopics(next)            // schedule React re-render
    setDragOverIdx(overIdx)
  }

  function onDragEnd() {
    dragId.current = null
    setDragOverIdx(null)
  }

  function onDrop(e) {
    e.preventDefault()
    dragId.current = null
    setDragOverIdx(null)
  }

  /* ─── Touch drag (mobile) ─── */
  const touchId  = useRef(null)   // _id of touched item
  const touchY   = useRef(0)

  function onTouchStart(e, id) {
    touchId.current = id
    touchY.current  = e.touches[0].clientY
  }

  function onTouchMove(e) {
    e.preventDefault()
    if (!touchId.current) return
    const y   = e.touches[0].clientY
    const els = Array.from(document.querySelectorAll('.reo-card'))
    let targetIdx = null
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      if (y >= r.top && y <= r.bottom) targetIdx = i
    })
    if (targetIdx === null) return

    const current = topicsRef.current
    const fromIdx = current.findIndex(t => t._id === touchId.current)
    if (fromIdx === -1 || fromIdx === targetIdx) return

    const next = [...current]
    const [item] = next.splice(fromIdx, 1)
    next.splice(targetIdx, 0, item)
    topicsRef.current = next
    setTopics(next)
    setDragOverIdx(targetIdx)
  }

  function onTouchEnd() {
    touchId.current = null
    setDragOverIdx(null)
  }

  /* ─── Save order ─── */
  async function saveOrder() {
    setSavingOrder(true)
    try {
      const orderedIds = topicsRef.current.map(t => t._id)
      const res  = await fetch('/api/admin/topics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Order saved!')
        setReorderMode(false)
        await fetchTopics()
      } else toast.error(data.error || 'Failed to save order')
    } catch { toast.error('Failed to save order') }
    setSavingOrder(false)
  }

  function cancelReorder() {
    setReorderMode(false)
    setDragOverIdx(null)
    fetchTopics()
  }

  /* ─── Up / Down buttons (fallback for accessibility) ─── */
  function moveUp(index) {
    if (index === 0) return
    const next = [...topicsRef.current]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    topicsRef.current = next
    setTopics(next)
  }

  function moveDown(index) {
    if (index === topicsRef.current.length - 1) return
    const next = [...topicsRef.current]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    topicsRef.current = next
    setTopics(next)
  }

  return (
    <>
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        /* Normal grid */
        .tp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
        .tp-card {
          background:#FFFFFF; border:1px solid #E5E7EB;
          border-radius:16px; overflow:hidden;
          transition:all .3s ease; box-shadow:0 2px 8px rgba(0,0,0,0.04);
        }
        .tp-card:hover { border-color:rgba(201,74,68,0.2); transform:translateY(-3px); box-shadow:0 12px 30px rgba(0,0,0,0.08); }
        .tp-card:hover .tp-name { color:#C94A44; }
        .tp-thumb-wrap { width:100%; aspect-ratio:16/9; overflow:hidden; background:#F7F6F3; position:relative; }
        .tp-thumb { width:100%; height:100%; object-fit:cover; display:block; transition:transform .4s ease; }
        .tp-card:hover .tp-thumb { transform:scale(1.05); }
        .tp-thumb-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:44px; background:rgba(201,74,68,0.04); }
        .tp-info { padding:14px 16px; }
        .tp-name { font-weight:700; font-size:14px; color:#2A2A2A; margin-bottom:4px; transition:color .2s; }
        .tp-desc { font-size:12px; color:#9CA3AF; line-height:1.5; margin-bottom:12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .tp-footer { display:flex; align-items:center; justify-content:space-between; }
        .tp-actions { display:flex; gap:6px; }
        .tp-btn-edit { padding:5px 12px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; background:rgba(201,74,68,0.08); border:1px solid rgba(201,74,68,0.15); color:#C94A44; }
        .tp-btn-edit:hover { background:rgba(201,74,68,0.15); }
        .tp-btn-del { padding:5px 12px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.15); color:#ef4444; }
        .tp-btn-del:hover:not(:disabled) { background:rgba(239,68,68,0.14); }
        .tp-btn-del:disabled { opacity:.4; cursor:not-allowed; }

        /* Upload area */
        .tp-upload-area {
          width:100%; aspect-ratio:4/3; border-radius:12px; overflow:hidden;
          border:2px dashed rgba(201,74,68,0.2); background:rgba(201,74,68,0.03);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          cursor:pointer; transition:all .2s; position:relative;
        }
        .tp-upload-area:hover { border-color:rgba(201,74,68,0.45); background:rgba(201,74,68,0.06); }
        .tp-upload-area.has-img { border-style:solid; border-color:rgba(201,74,68,0.25); }
        .tp-upload-area img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
        .tp-upload-overlay { position:absolute; inset:0; background:rgba(42,42,42,0.45); display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; transition:opacity .2s; }
        .tp-upload-area:hover .tp-upload-overlay { opacity:1; }
        .tp-upload-spinner { position:absolute; inset:0; background:rgba(247,246,243,0.85); display:flex; align-items:center; justify-content:center; }
        .tp-form-grid { display:grid; grid-template-columns:210px 1fr; gap:22px; align-items:start; }
        @media(max-width:640px) { .tp-form-grid { grid-template-columns:1fr; } }

        /* Skeleton */
        .tp-skel-card { background:#FFFFFF; border:1px solid #E5E7EB; border-radius:16px; overflow:hidden; }
        .tp-skel-bg   { background:#F3F4F6; animation:pulse 1.5s infinite; }

        /* ── Reorder list ── */
        .reo-list { display:flex; flex-direction:column; gap:8px; }

        .reo-card {
          display:flex; align-items:center; gap:12px;
          background:#FFFFFF; border:1.5px solid #E5E7EB;
          border-radius:14px; padding:10px 14px 10px 10px;
          transition:box-shadow .15s, border-color .15s, transform .15s, opacity .15s;
          position:relative; overflow:hidden;
          /* IMPORTANT: set will-change so browser composites separately */
          will-change: transform;
        }
        .reo-card[data-dragging="true"] {
          opacity:.5;
          border-color:rgba(201,74,68,0.3);
          box-shadow:0 2px 8px rgba(0,0,0,0.07);
        }
        .reo-card[data-over="true"] {
          border-color:#C94A44 !important;
          box-shadow:0 0 0 3px rgba(201,74,68,0.15), 0 6px 20px rgba(201,74,68,0.12) !important;
          transform:translateY(-2px);
          background:rgba(201,74,68,0.02);
        }
        .reo-card:not([data-dragging="true"]):not([data-over="true"]):hover {
          border-color:rgba(201,74,68,0.22);
          box-shadow:0 4px 14px rgba(0,0,0,0.05);
        }

        .reo-handle {
          display:flex; flex-direction:column; gap:3.5px;
          padding:8px 4px 8px 2px; flex-shrink:0;
          cursor:grab; opacity:0.35; transition:opacity .18s;
          touch-action:none;
        }
        .reo-card:hover .reo-handle,
        .reo-card[data-dragging="true"] .reo-handle { opacity:0.75; }
        .reo-handle span { display:block; width:20px; height:2.5px; background:#6B7280; border-radius:3px; }

        .reo-thumb {
          width:60px; height:34px; border-radius:7px;
          overflow:hidden; flex-shrink:0; background:#F0EDE8;
          display:flex; align-items:center; justify-content:center;
          font-size:17px; border:1px solid #E5E7EB;
        }
        .reo-thumb img { width:100%; height:100%; object-fit:cover; display:block; }

        .reo-info { flex:1; min-width:0; }
        .reo-name { font-weight:700; font-size:13px; color:#2A2A2A;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .reo-desc { font-size:11px; color:#9CA3AF; margin-top:2px;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        .reo-index {
          width:26px; height:26px; border-radius:8px; flex-shrink:0;
          background:rgba(201,74,68,0.07); border:1px solid rgba(201,74,68,0.15);
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:800; color:#C94A44;
        }

        .reo-badge {
          font-size:10px; color:#6B7280;
          background:#F3F4F6; border:1px solid #E5E7EB;
          padding:3px 9px; border-radius:999px; flex-shrink:0;
          white-space:nowrap;
        }

        .reo-updown { display:flex; flex-direction:column; gap:2px; flex-shrink:0; }
        .reo-updown button {
          all:unset; cursor:pointer; width:22px; height:18px;
          display:flex; align-items:center; justify-content:center;
          border-radius:5px; font-size:10px;
          color:#9CA3AF; transition:all .15s;
          background:transparent;
        }
        .reo-updown button:hover:not(:disabled) { background:rgba(201,74,68,0.08); color:#C94A44; }
        .reo-updown button:disabled { opacity:0.2; cursor:not-allowed; }

        /* Toolbar */
        .reo-toolbar {
          display:flex; align-items:center; gap:12px;
          padding:14px 18px;
          background:linear-gradient(135deg,rgba(201,74,68,0.04),rgba(201,74,68,0.01));
          border:1.5px dashed rgba(201,74,68,0.28);
          border-radius:14px; margin-bottom:16px; flex-wrap:wrap;
        }
        .reo-toolbar-icon {
          width:38px; height:38px; border-radius:10px; flex-shrink:0;
          background:rgba(201,74,68,0.09); border:1px solid rgba(201,74,68,0.18);
          display:flex; align-items:center; justify-content:center; font-size:17px;
        }
        .reo-toolbar-title { font-weight:700; font-size:13px; color:#2A2A2A; }
        .reo-toolbar-sub   { font-size:11px; color:#9CA3AF; margin-top:2px; }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:'24px', color:'#2A2A2A', marginBottom:'4px' }}>
              Topics
            </h1>
            <p style={{ color:'#6B7280', fontSize:'13px' }}>
              Manage course topics for organizing premium videos
              <span style={{ color:'#C94A44', fontWeight:600, marginLeft:'6px' }}>({topics.length} topics)</span>
            </p>
          </div>

          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {!reorderMode ? (
              <>
                <button onClick={fetchTopics} className="adm-btn-secondary">🔄</button>
                {topics.length > 1 && (
                  <button
                    onClick={() => { setReorderMode(true); setShowForm(false); resetForm() }}
                    className="adm-btn-secondary"
                    style={{ display:'flex', alignItems:'center', gap:'5px' }}
                  >
                    ⇅ Reorder
                  </button>
                )}
                <button
                  onClick={() => {
                    if (showForm && !editingId) resetForm()
                    else { resetForm(); setShowForm(true) }
                  }}
                  className="adm-btn-primary"
                >
                  {showForm && !editingId ? '× Cancel' : '+ Add Topic'}
                </button>
              </>
            ) : (
              <>
                <button onClick={cancelReorder} disabled={savingOrder} className="adm-btn-secondary">
                  × Cancel
                </button>
                <button
                  onClick={saveOrder}
                  disabled={savingOrder}
                  className="adm-btn-primary"
                  style={{ display:'flex', alignItems:'center', gap:'6px', minWidth:'110px', justifyContent:'center' }}
                >
                  {savingOrder ? (
                    <>
                      <svg style={{ width:'13px', height:'13px', animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Saving…
                    </>
                  ) : '✓ Save Order'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Add / Edit Form ── */}
        {showForm && !reorderMode && (
          <div className="adm-card" style={{ position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent,#C94A44,transparent)' }}/>
            <h3 style={{ fontWeight:700, color:'#2A2A2A', fontSize:'15px', marginBottom:'20px' }}>
              {editingId ? '✏️ Edit Topic' : '➕ New Topic'}
            </h3>
            <form onSubmit={handleSave}>
              <div className="tp-form-grid">
                {/* Thumbnail upload */}
                <div>
                  <label style={{ display:'block', fontSize:'12px', color:'#6B7280', marginBottom:'8px', fontWeight:600 }}>
                    Thumbnail <span style={{ color:'#9CA3AF', fontWeight:400 }}>(recommended)</span>
                  </label>
                  <div
                    className={`tp-upload-area ${previewUrl ? 'has-img' : ''}`}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Preview"/>
                        <div className="tp-upload-overlay">
                          <span style={{ color:'#fff', fontSize:'13px', fontWeight:600 }}>📷 Change</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize:'30px', marginBottom:'8px' }}>📷</span>
                        <span style={{ fontSize:'12px', color:'#6B7280', fontWeight:600 }}>Click to upload</span>
                        <span style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'4px' }}>JPEG, PNG, WebP • Max 5MB</span>
                      </>
                    )}
                    {uploading && (
                      <div className="tp-upload-spinner">
                        <svg style={{ width:'28px', height:'28px', animation:'spin 1s linear infinite', color:'#C94A44' }} fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef} type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileUpload} style={{ display:'none' }}
                  />
                </div>

                {/* Text fields */}
                <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', color:'#6B7280', marginBottom:'6px', fontWeight:600 }}>
                      Topic Name <span style={{ color:'#C94A44' }}>*</span>
                    </label>
                    <input
                      type="text" placeholder="e.g. Office Procedure"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="adm-input" required disabled={saving}
                    />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', color:'#6B7280', marginBottom:'6px', fontWeight:600 }}>
                      Description
                    </label>
                    <textarea
                      placeholder="Brief description of this topic..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="adm-input" style={{ minHeight:'80px', resize:'vertical' }}
                      disabled={saving}
                    />
                  </div>
                  <div style={{ display:'flex', gap:'10px', marginTop:'4px' }}>
                    <button type="submit" disabled={saving || uploading} className="adm-btn-primary">
                      {saving ? (
                        <>
                          <svg style={{ width:'14px', height:'14px', animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                            <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Saving...
                        </>
                      ) : editingId ? '✓ Update Topic' : '+ Create Topic'}
                    </button>
                    <button type="button" onClick={resetForm} className="adm-btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ═══════════════════════════════
            REORDER MODE
        ═══════════════════════════════ */}
        {reorderMode && !loading && (
          <div style={{ animation:'fadeInUp 0.28s ease both' }}>

            {/* Toolbar */}
            <div className="reo-toolbar">
              <div className="reo-toolbar-icon">⇅</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="reo-toolbar-title">Drag to reorder topics</div>
                <div className="reo-toolbar-sub">
                  Grab the ≡ handle · use ▲▼ buttons on mobile · click Save Order when done
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                <button onClick={cancelReorder} disabled={savingOrder} className="adm-btn-secondary" style={{ fontSize:'12px' }}>
                  Cancel
                </button>
                <button
                  onClick={saveOrder}
                  disabled={savingOrder}
                  className="adm-btn-primary"
                  style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px' }}
                >
                  {savingOrder ? (
                    <>
                      <svg style={{ width:'12px', height:'12px', animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Saving…
                    </>
                  ) : '✓ Save Order'}
                </button>
              </div>
            </div>

            {/* Draggable list */}
            <div
              className="reo-list"
              onDragOver={e => e.preventDefault()}
            >
              {topics.map((topic, index) => {
                const isDragging = dragId.current === topic._id
                const isOver     = dragOverIdx === index && dragId.current !== topic._id

                return (
                  <div
                    key={topic._id}
                    className="reo-card"
                    data-dragging={String(isDragging)}
                    data-over={String(isOver)}
                    draggable
                    onDragStart={e => onDragStart(e, topic._id)}
                    onDragOver={e => onDragOver(e, index)}
                    onDragEnd={onDragEnd}
                    onDrop={onDrop}
                    onTouchStart={e => onTouchStart(e, topic._id)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    {/* ≡ Drag handle */}
                    <div className="reo-handle" aria-label="Drag handle">
                      <span/><span/><span/>
                    </div>

                    {/* Position number */}
                    <div className="reo-index">{index + 1}</div>

                    {/* Thumbnail */}
                    <div className="reo-thumb">
                      {topic.thumbnail
                        ? <img src={topic.thumbnail} alt={topic.name}/>
                        : <span>📚</span>
                      }
                    </div>

                    {/* Name + description */}
                    <div className="reo-info">
                      <div className="reo-name">{topic.name}</div>
                      {topic.description && (
                        <div className="reo-desc">{topic.description}</div>
                      )}
                    </div>

                    {/* Video count */}
                    <div className="reo-badge">{topic.videoCount || 0} videos</div>

                    {/* Active badge */}
                    <span
                      className={`adm-badge ${topic.isActive !== false ? 'adm-badge-green' : 'adm-badge-gray'}`}
                      style={{ flexShrink:0 }}
                    >
                      {topic.isActive !== false ? '● Active' : '○ Hidden'}
                    </span>

                    {/* ▲▼ fallback buttons */}
                    <div className="reo-updown">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        title="Move up"
                      >▲</button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === topics.length - 1}
                        title="Move down"
                      >▼</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom save bar */}
            <div style={{
              display:'flex', justifyContent:'flex-end', gap:'10px',
              marginTop:'20px', paddingTop:'16px',
              borderTop:'1px solid #E5E7EB',
            }}>
              <button onClick={cancelReorder} disabled={savingOrder} className="adm-btn-secondary">
                × Cancel
              </button>
              <button
                onClick={saveOrder}
                disabled={savingOrder}
                className="adm-btn-primary"
                style={{ display:'flex', alignItems:'center', gap:'6px', minWidth:'120px', justifyContent:'center' }}
              >
                {savingOrder ? (
                  <>
                    <svg style={{ width:'13px', height:'13px', animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Saving…
                  </>
                ) : '✓ Save Order'}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════
            NORMAL GRID VIEW
        ═══════════════════════════════ */}
        {!reorderMode && (
          <>
            {loading ? (
              <div className="tp-grid">
                {[1,2,3].map(i => (
                  <div key={i} className="tp-skel-card">
                    <div style={{ width:'100%', aspectRatio:'16/9' }} className="tp-skel-bg"/>
                    <div style={{ padding:'14px 16px' }}>
                      <div className="tp-skel-bg" style={{ height:'14px', width:'55%', borderRadius:'8px', marginBottom:'10px' }}/>
                      <div className="tp-skel-bg" style={{ height:'11px', width:'85%', borderRadius:'8px' }}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : topics.length === 0 ? (
              <div className="adm-card" style={{ textAlign:'center', padding:'60px 24px' }}>
                <div style={{ fontSize:'48px', marginBottom:'12px' }}>📚</div>
                <p style={{ color:'#6B7280', fontWeight:600, fontSize:'15px', marginBottom:'6px' }}>No topics yet</p>
                <p style={{ color:'#9CA3AF', fontSize:'13px' }}>Create your first topic to organize premium videos.</p>
              </div>
            ) : (
              <div className="tp-grid">
                {topics.map(topic => (
                  <div key={topic._id} className="tp-card">
                    <div className="tp-thumb-wrap">
                      {topic.thumbnail
                        ? <img src={topic.thumbnail} alt={topic.name} className="tp-thumb"/>
                        : <div className="tp-thumb-placeholder">📚</div>
                      }
                    </div>
                    <div className="tp-info">
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'8px', gap:'8px' }}>
                        <div style={{ flex:1 }}>
                          <h3 className="tp-name">{topic.name}</h3>
                          <p className="tp-desc">{topic.description || 'No description'}</p>
                        </div>
                        <span className="adm-badge adm-badge-cta" style={{ flexShrink:0 }}>
                          {topic.videoCount || 0} videos
                        </span>
                      </div>
                      <div className="tp-footer">
                        <span className={`adm-badge ${topic.isActive !== false ? 'adm-badge-green' : 'adm-badge-gray'}`}>
                          {topic.isActive !== false ? '● Active' : '○ Hidden'}
                        </span>
                        <div className="tp-actions">
                          <button onClick={() => startEdit(topic)} className="tp-btn-edit">✏️ Edit</button>
                          <button
                            onClick={() => handleDelete(topic._id)}
                            disabled={deleting === topic._id}
                            className="tp-btn-del"
                          >
                            {deleting === topic._id ? '...' : '🗑️'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}