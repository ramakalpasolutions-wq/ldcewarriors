// src/app/admin/materials/page.js
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { uploadVideoToR2Direct } from '@/lib/clientUpload'
import AdminTopicGrid, { AdminTopicBar, useAdminTopic, byOrderNumber } from '@/components/admin/AdminTopicGrid'

const tk = {
  navy: '#1B2A4A',
  gold: '#E8A838',
  goldDark: '#D4922A',
  red: '#C8102E',
  purple: '#6D28D9',
  bg: '#F5F3EF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#1A1D23',
  muted: '#6B7280',
}

const EMPTY_FORM = {
  title: '',
  chapterNo: '',
  description: '',
  topicId: '',
  pageCount: '',
  accessType: 'FREE',
  order: '0',
  isPublished: true,
}

// Best-effort page count read straight from the PDF bytes.
// Works for most PDFs; admin can always correct it by hand.
async function guessPdfPages(file) {
  try {
    const text = new TextDecoder('latin1').decode(await file.arrayBuffer())
    const counts = [...text.matchAll(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)/g)].map(m => +m[1])
    if (counts.length) return Math.max(...counts)
    const pages = text.match(/\/Type\s*\/Page(?![s\w])/g)
    return pages ? pages.length : null
  } catch {
    return null
  }
}

function formatSize(bytes) {
  if (!bytes) return ''
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState([])
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [pdfFile, setPdfFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, tRes] = await Promise.all([
        fetch('/api/admin/materials', { credentials: 'include' }),
        fetch('/api/admin/topics', { credentials: 'include' }),
      ])
      const [mData, tData] = await Promise.all([mRes.json(), tRes.json()])
      if (mData.success) setMaterials(mData.materials)
      else toast.error(mData.error || 'Failed to load materials')
      if (tData.success) setTopics(tData.topics || [])
    } catch {
      toast.error('Failed to load materials')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setForm(EMPTY_FORM)
    setPdfFile(null)
    setEditingId(null)
    setShowForm(false)
    setProgress(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  // Topic-first view: null = topic grid, 'none' = textbooks without a topic
  const [topicSel, setTopicSel] = useAdminTopic()
  const topicCounts = materials.reduce((acc, m) => {
    const key = m.topicId || 'none'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const topicMaterials = materials
    .filter(m => (m.topicId || 'none') === topicSel)
    .sort(byOrderNumber())
  const currentTopic =
    topicSel === 'none'
      ? { name: 'No topic', icon: '📦' }
      : topics.find(t => (t._id || t.id) === topicSel)

  // New textbooks go into the open topic, numbered after its last chapter
  function startCreate() {
    resetForm()
    const nextChapter = topicMaterials.reduce((max, m) => Math.max(max, m.chapterNo || 0, m.order || 0), 0) + 1
    setForm({
      ...EMPTY_FORM,
      topicId: topicSel && topicSel !== 'none' ? topicSel : '',
      chapterNo: String(nextChapter),
      order: String(nextChapter),
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startEdit(m) {
    setEditingId(m.id)
    setPdfFile(null)
    setForm({
      title: m.title || '',
      chapterNo: m.chapterNo ?? '',
      description: m.description || '',
      topicId: m.topicId || '',
      pageCount: m.pageCount ?? '',
      accessType: m.accessType || 'FREE',
      order: String(m.order ?? 0),
      isPublished: m.isPublished,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      toast.error('Only PDF files are allowed')
      e.target.value = ''
      return
    }
    setPdfFile(file)

    const pages = await guessPdfPages(file)
    setForm(prev => ({
      ...prev,
      pageCount: pages ? String(pages) : prev.pageCount,
      title: prev.title || file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim(),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    if (!editingId && !pdfFile) return toast.error('Please choose a PDF file')

    setSaving(true)
    try {
      let upload = {}
      if (pdfFile) {
        setProgress(1)
        const pdf = new File([pdfFile], pdfFile.name, { type: 'application/pdf' })
        const { key } = await uploadVideoToR2Direct(pdf, 'materials', setProgress)
        upload = { pdfKey: key, fileName: pdfFile.name, fileSize: pdfFile.size }
      }

      const res = await fetch('/api/admin/materials', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, ...upload, id: editingId || undefined }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Save failed')

      toast.success(editingId ? 'Material updated' : 'Material added')
      resetForm()
      load()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    }
    setSaving(false)
  }

  async function togglePublish(m) {
    const res = await fetch('/api/admin/materials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: m.id, isPublished: !m.isPublished }),
    })
    const data = await res.json()
    if (data.success) {
      setMaterials(list => list.map(x => (x.id === m.id ? data.material : x)))
    } else toast.error(data.error || 'Update failed')
  }

  async function handleDelete(m) {
    if (!confirm(`Delete "${m.title}"? The PDF will be removed permanently.`)) return
    setDeleting(m.id)
    try {
      const res = await fetch(`/api/admin/materials?id=${m.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Material deleted')
      setMaterials(list => list.filter(x => x.id !== m.id))
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
    setDeleting(null)
  }

  function preview(m) {
    window.location.href = `/materials/read/${m.id}`
  }

  const set = key => e =>
    setForm(prev => ({
      ...prev,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  return (
    <div className="am-wrap">
      <div className="am-header">
        <div>
          <h1>Digital Textbook</h1>
          <p>Upload chapter PDFs that students read under Digital Textbook.</p>
        </div>
        {!showForm && !topicSel && (
          <button className="am-btn am-btn-gold" onClick={startCreate}>+ Add Material</button>
        )}
      </div>

      {showForm && (
        <form className="am-card am-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit Material' : 'New Material'}</h2>

          <div className="am-grid">
            <label className="am-field am-span2">
              <span>PDF file {editingId && <em>(leave empty to keep current)</em>}</span>
              <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={handleFile} />
              {pdfFile && (
                <small>{pdfFile.name} · {formatSize(pdfFile.size)}</small>
              )}
            </label>

            <label className="am-field am-span2">
              <span>Title *</span>
              <input value={form.title} onChange={set('title')} placeholder="Engineering Mechanics" />
            </label>

            <label className="am-field">
              <span>Chapter no.</span>
              <input type="number" min="0" value={form.chapterNo} onChange={set('chapterNo')} placeholder="1" />
            </label>

            <label className="am-field">
              <span>Pages</span>
              <input type="number" min="0" value={form.pageCount} onChange={set('pageCount')} placeholder="10" />
            </label>

            <label className="am-field">
              <span>Topic</span>
              <select value={form.topicId} onChange={set('topicId')}>
                <option value="">— None —</option>
                {topics.map(t => (
                  <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>
                ))}
              </select>
            </label>

            <label className="am-field">
              <span>Access</span>
              <select value={form.accessType} onChange={set('accessType')}>
                <option value="FREE">Free — anyone can read</option>
                <option value="PREMIUM">Premium — Join Family members</option>
              </select>
            </label>

            <label className="am-field">
              <span>Order No. <em>(1 = first)</em></span>
              <input type="number" min="0" value={form.order} onChange={set('order')} placeholder="e.g. 1" />
            </label>

            <label className="am-field am-check">
              <input type="checkbox" checked={form.isPublished} onChange={set('isPublished')} />
              <span>Published (visible to students)</span>
            </label>

            <label className="am-field am-span2">
              <span>Short description</span>
              <textarea rows={2} value={form.description} onChange={set('description')} placeholder="Optional" />
            </label>
          </div>

          {saving && progress > 0 && (
            <div className="am-progress">
              <div style={{ width: `${progress}%` }} />
              <span>Uploading PDF… {progress}%</span>
            </div>
          )}

          <div className="am-actions">
            <button type="button" className="am-btn" onClick={resetForm} disabled={saving}>Cancel</button>
            <button type="submit" className="am-btn am-btn-gold" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Material'}
            </button>
          </div>
        </form>
      )}

      {!topicSel ? (
        <AdminTopicGrid
          topics={topics}
          counts={topicCounts}
          extraTiles={[{ id: 'none', name: 'No topic', icon: '📦' }]}
          unit="textbooks"
          loading={loading}
          onSelect={setTopicSel}
        />
      ) : (
      <>
      <div style={{ marginBottom: 14 }}>
        <AdminTopicBar
          topic={currentTopic}
          count={topicMaterials.length}
          unit="textbooks"
          onBack={() => { setTopicSel(null); resetForm() }}
        >
          {!showForm && (
            <button className="am-btn am-btn-gold" onClick={startCreate}>+ Add textbook here</button>
          )}
        </AdminTopicBar>
      </div>
      {loading ? (
        <div className="am-card am-empty">Loading…</div>
      ) : topicMaterials.length === 0 ? (
        <div className="am-card am-empty">No textbooks in this topic yet — use “+ Add textbook here”.</div>
      ) : (
        <div className="am-list">
          {topicMaterials.map(m => (
            <div key={m.id} className="am-card am-row">
              <div className="am-badge">
                {m.chapterNo ? String(m.chapterNo).padStart(2, '0') : 'PDF'}
              </div>
              <div className="am-info">
                <h3>{m.order > 0 && <span className="am-order">#{m.order}</span>}{m.title}</h3>
                <div className="am-meta">
                  {m.topic?.name && <span>🏷️ {m.topic.name}</span>}
                  {m.pageCount ? <span>📄 {m.pageCount} pages</span> : null}
                  {m.fileSize ? <span>{formatSize(m.fileSize)}</span> : null}
                  <span className={m.accessType === 'PREMIUM' ? 'am-pill am-pill-gold' : 'am-pill'}>
                    {m.accessType === 'PREMIUM' ? '⭐ Premium' : 'Free'}
                  </span>
                  <span className={m.isPublished ? 'am-pill am-pill-green' : 'am-pill am-pill-grey'}>
                    {m.isPublished ? 'Published' : 'Hidden'}
                  </span>
                  <span>👁 {m.views}</span>
                </div>
              </div>
              <div className="am-row-actions">
                <button className="am-btn am-btn-sm" onClick={() => preview(m)} disabled={!m.isPublished}>View</button>
                <button className="am-btn am-btn-sm" onClick={() => togglePublish(m)}>
                  {m.isPublished ? 'Hide' : 'Publish'}
                </button>
                <button className="am-btn am-btn-sm" onClick={() => startEdit(m)}>Edit</button>
                <button
                  className="am-btn am-btn-sm am-btn-red"
                  onClick={() => handleDelete(m)}
                  disabled={deleting === m.id}
                >
                  {deleting === m.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      <style>{`
        .am-wrap { max-width: 1000px; margin: 0 auto; color: ${tk.text}; }
        .am-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:20px; flex-wrap:wrap; }
        .am-header h1 { font-size:24px; font-weight:800; color:${tk.navy}; margin:0; }
        .am-header p { color:${tk.muted}; font-size:14px; margin:4px 0 0; }
        .am-card { background:${tk.card}; border:1px solid ${tk.border}; border-radius:14px; padding:18px; }
        .am-form { margin-bottom:20px; }
        .am-form h2 { font-size:17px; font-weight:800; color:${tk.navy}; margin:0 0 14px; }
        .am-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
        .am-span2 { grid-column: span 2; }
        .am-field { display:flex; flex-direction:column; gap:6px; font-size:13px; }
        .am-field > span { font-weight:700; color:${tk.navy}; }
        .am-field em { font-weight:400; color:${tk.muted}; }
        .am-field small { color:${tk.muted}; }
        .am-field input:not([type=checkbox]), .am-field select, .am-field textarea {
          border:1px solid ${tk.border}; border-radius:10px; padding:10px 12px; font-size:14px;
          background:#fff; color:${tk.text}; outline:none; font-family:inherit;
        }
        .am-field input:focus, .am-field select:focus, .am-field textarea:focus { border-color:${tk.gold}; }
        .am-check { flex-direction:row; align-items:center; gap:8px; align-self:end; padding-bottom:10px; }
        .am-check input { width:18px; height:18px; accent-color:${tk.gold}; }
        .am-progress { position:relative; height:28px; margin-top:16px; background:${tk.bg}; border-radius:8px; overflow:hidden; }
        .am-progress div { height:100%; background:${tk.gold}; transition:width .2s; }
        .am-progress span { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:${tk.navy}; }
        .am-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:16px; }
        .am-btn { border:1px solid ${tk.border}; background:#fff; color:${tk.navy}; padding:10px 18px; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; }
        .am-btn:disabled { opacity:.5; cursor:not-allowed; }
        .am-btn-gold { background:${tk.gold}; border-color:${tk.gold}; }
        .am-btn-gold:hover:not(:disabled) { background:${tk.goldDark}; }
        .am-btn-red { color:${tk.red}; }
        .am-btn-sm { padding:7px 12px; font-size:12px; }
        .am-empty { text-align:center; color:${tk.muted}; padding:40px 18px; }
        .am-list { display:flex; flex-direction:column; gap:10px; }
        .am-row { display:flex; align-items:center; gap:14px; padding:14px; }
        .am-badge { flex-shrink:0; width:52px; height:52px; border-radius:12px; display:flex; align-items:center; justify-content:center;
          background:linear-gradient(135deg,#7C3AED,#4C1D95); color:#fff; font-weight:900; font-size:18px; }
        .am-info { flex:1; min-width:0; }
        .am-order { color:#D4922A; margin-right:6px; }
        .am-info h3 { margin:0 0 6px; font-size:15px; font-weight:800; color:${tk.navy}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .am-meta { display:flex; flex-wrap:wrap; gap:6px 12px; font-size:12px; color:${tk.muted}; align-items:center; }
        .am-pill { padding:2px 8px; border-radius:999px; background:${tk.bg}; font-weight:700; }
        .am-pill-gold { background:#FEF3C7; color:#92400E; }
        .am-pill-green { background:#DCFCE7; color:#166534; }
        .am-pill-grey { background:#F3F4F6; color:${tk.muted}; }
        .am-row-actions { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
        @media (max-width: 640px) {
          .am-grid { grid-template-columns:1fr; }
          .am-span2 { grid-column:auto; }
          .am-row { flex-wrap:wrap; }
          .am-row-actions { width:100%; justify-content:flex-start; }
        }
      `}</style>
    </div>
  )
}
