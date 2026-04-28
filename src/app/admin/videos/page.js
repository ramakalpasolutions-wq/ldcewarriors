// src/app/admin/videos/page.js
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

const tk = {
  navy: '#1B2A4A', navyLight: '#243656',
  gold: '#E8A838', goldDark: '#D4922A',
  teal: '#2A9D8F',
  bg: '#F5F3EF', card: '#FFFFFF',
  border: '#E5E7EB', text: '#1A1D23',
  muted: '#6B7280', faint: '#9CA3AF',
}

function fmtSize(b) {
  if (!b) return ''
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateShort(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

/* ── Skeleton ── */
function SkeletonRow({ cols = 8 }) {
  const widths = [80, 60, 80, 70, 50, 40, 60, 50]
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '13px 14px' }}>
          <div style={{
            height: '13px', width: `${widths[i] || 60}px`, borderRadius: '5px',
            background: 'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
          }} />
        </td>
      ))}
    </tr>
  )
}

/* ── Upload Progress ── */
function UploadProgress({ progress, stage }) {
  const stages = [
    { key: 'thumb', label: 'Thumbnail…', icon: '🖼️' },
    { key: 'video', label: 'Uploading…', icon: '☁️' },
    { key: 'saving', label: 'Saving…', icon: '💾' },
    { key: 'done', label: 'Complete!', icon: '✅' },
  ]
  const current = stages.find(s => s.key === stage) || stages[0]
  return (
    <div style={{
      padding: '16px', borderRadius: '14px',
      background: 'linear-gradient(135deg,rgba(27,42,74,0.03),rgba(232,168,56,0.04))',
      border: '1.5px solid rgba(232,168,56,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px' }}>{current.icon}</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: tk.text }}>{current.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 700, color: tk.gold }}>
          {progress}%
        </span>
      </div>
      <div style={{ height: '7px', borderRadius: '999px', background: 'rgba(27,42,74,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '999px', width: `${progress}%`,
          background: `linear-gradient(90deg,${tk.navy},${tk.gold})`,
          transition: 'width 0.4s ease',
          boxShadow: '0 0 8px rgba(232,168,56,0.4)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', gap: '4px' }}>
        {stages.map((s, i) => (
          <div key={s.key} style={{
            flex: 1, height: '3px', borderRadius: '999px',
            background: stages.indexOf(current) >= i
              ? `linear-gradient(90deg,${tk.navy},${tk.gold})` : 'rgba(27,42,74,0.1)',
            transition: 'background 0.4s ease',
          }} />
        ))}
      </div>
    </div>
  )
}

/* ── File Drop Zone ── */
function FileDropZone({ label, accept, hint, file, preview, onChange, disabled, maxSizeMB }) {
  const ref = useRef(null)
  const [drag, setDrag] = useState(false)

  function handleFile(f) {
    if (!f) return
    if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File must be under ${maxSizeMB}MB`); return
    }
    onChange(f)
  }

  return (
    <div>
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: 700,
        color: tk.navy, marginBottom: '7px', letterSpacing: '0.3px',
      }}>
        {label}<span style={{ color: tk.gold }}> *</span>
        {hint && <span style={{ color: tk.faint, fontWeight: 400, marginLeft: '4px' }}>({hint})</span>}
      </label>
      <div
        onClick={() => !disabled && ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
        style={{
          border: `2px dashed ${drag ? tk.gold : file ? tk.teal : tk.border}`,
          borderRadius: '12px', padding: '16px 12px',
          textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
          background: drag ? 'rgba(232,168,56,0.04)' : file ? 'rgba(42,157,143,0.04)' : 'rgba(27,42,74,0.02)',
          transition: 'all 0.25s ease', opacity: disabled ? 0.6 : 1,
          minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} disabled={disabled}
          onChange={e => handleFile(e.target.files[0])} />
        {preview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={preview} alt="Preview" style={{
              height: '80px', maxWidth: '100%', borderRadius: '9px',
              objectFit: 'cover', border: `1.5px solid ${tk.border}`,
              boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
            }} />
            <div style={{
              position: 'absolute', top: '-5px', right: '-5px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: tk.teal, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 800,
            }}>✓</div>
          </div>
        ) : file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '24px' }}>🎬</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: tk.text, wordBreak: 'break-all', maxWidth: '140px' }}>
              {file.name}
            </span>
            <span style={{ fontSize: '10px', color: tk.faint }}>{fmtSize(file.size)}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '28px' }}>{drag ? '📥' : '☁️'}</span>
            <p style={{ fontSize: '12px', fontWeight: 600, color: tk.text, margin: 0 }}>
              {drag ? 'Drop here' : 'Click or drag & drop'}
            </p>
            <p style={{ fontSize: '10px', color: tk.faint, margin: 0 }}>{accept}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Mobile Video Card ── */
function MobileVideoCard({ video, onEdit, onDelete, onToggle, deleting }) {
  return (
    <div style={{
      background: tk.card, border: `1.5px solid ${tk.border}`,
      borderRadius: '14px', padding: '13px', marginBottom: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        {video.thumbnail
          ? <img src={video.thumbnail} alt="" style={{
            width: '68px', height: '44px', borderRadius: '8px',
            objectFit: 'cover', border: `1.5px solid ${tk.border}`, flexShrink: 0,
          }} />
          : <div style={{
            width: '68px', height: '44px', borderRadius: '8px',
            background: 'rgba(27,42,74,0.06)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0, border: `1.5px solid ${tk.border}`,
          }}>🎥</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '13px', fontWeight: 700, color: tk.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: '5px',
          }}>{video.title}</p>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '2px 7px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
              background: video.type === 'premium' ? 'rgba(232,168,56,0.12)' : 'rgba(42,157,143,0.1)',
              color: video.type === 'premium' ? tk.goldDark : tk.teal,
              border: `1px solid ${video.type === 'premium' ? 'rgba(232,168,56,0.25)' : 'rgba(42,157,143,0.2)'}`,
            }}>
              {video.type === 'premium' ? '⭐ Premium' : '🎬 Free'}
            </span>
            {video.showOnHomepage && (
              <span style={{
                fontSize: '10px', fontWeight: 700, color: tk.teal,
                background: 'rgba(42,157,143,0.1)', border: '1px solid rgba(42,157,143,0.2)',
                padding: '2px 7px', borderRadius: '999px',
              }}>Home</span>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '7px', marginBottom: '10px',
        padding: '9px 11px', borderRadius: '9px',
        background: 'rgba(27,42,74,0.02)', border: `1px solid ${tk.border}`,
      }}>
        {[
          { lbl: 'TOPIC', val: video.topicName || '—' },
          { lbl: 'PLAYS', val: video.type === 'premium' ? `🔒 ${video.playLimit || 3} max` : 'Unlimited' },
          { lbl: 'VIEWS', val: video.views || 0 },
          { lbl: 'ADDED', val: fmtDateShort(video.createdAt) },
        ].map(item => (
          <div key={item.lbl}>
            <p style={{ fontSize: '9px', color: tk.faint, fontWeight: 700, marginBottom: '2px' }}>{item.lbl}</p>
            <p style={{ fontSize: '12px', color: tk.text, fontWeight: 600 }}>{item.val}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
          <div style={{ position: 'relative', width: '34px', height: '19px' }}>
            <input type="checkbox" checked={video.isActive} onChange={() => onToggle(video)}
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '10px',
              background: video.isActive ? tk.teal : '#E5E7EB', transition: '0.3s',
            }}>
              <div style={{
                position: 'absolute', width: '13px', height: '13px', borderRadius: '50%',
                background: '#fff', top: '3px',
                left: video.isActive ? '18px' : '3px',
                transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
          <span style={{ fontSize: '11px', color: tk.muted, fontWeight: 500 }}>
            {video.isActive ? 'Visible' : 'Hidden'}
          </span>
        </label>
        <div style={{ display: 'flex', gap: '7px' }}>
          <button onClick={() => onEdit(video)} style={{
            fontSize: '12px', fontWeight: 600, color: tk.navy,
            background: 'rgba(27,42,74,0.06)', border: `1.5px solid rgba(27,42,74,0.12)`,
            cursor: 'pointer', padding: '7px 12px', borderRadius: '8px', fontFamily: 'inherit',
          }}>✏️ Edit</button>
          <button onClick={() => onDelete(video._id)} disabled={deleting === video._id} style={{
            fontSize: '12px', fontWeight: 600, color: '#ef4444',
            background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.15)',
            cursor: deleting === video._id ? 'not-allowed' : 'pointer',
            padding: '7px 12px', borderRadius: '8px',
            opacity: deleting === video._id ? 0.5 : 1, fontFamily: 'inherit',
          }}>{deleting === video._id ? '…' : '🗑️'}</button>
        </div>
      </div>
    </div>
  )
}

/* ── Tablet Video Card ── */
function TabletVideoCard({ video, onEdit, onDelete, onToggle, deleting }) {
  return (
    <div style={{
      background: tk.card, border: `1.5px solid ${tk.border}`,
      borderRadius: '12px', padding: '12px 14px', marginBottom: '8px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      {/* Thumb */}
      {video.thumbnail
        ? <img src={video.thumbnail} alt="" style={{
          width: '80px', height: '50px', borderRadius: '8px',
          objectFit: 'cover', border: `1.5px solid ${tk.border}`, flexShrink: 0,
        }} />
        : <div style={{
          width: '80px', height: '50px', borderRadius: '8px',
          background: 'rgba(27,42,74,0.06)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '20px', flexShrink: 0,
          border: `1.5px solid ${tk.border}`,
        }}>🎥</div>
      }

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '5px' }}>
          <p style={{
            fontSize: '13px', fontWeight: 700, color: tk.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1, minWidth: 0,
          }}>{video.title}</p>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
            background: video.type === 'premium' ? 'rgba(232,168,56,0.12)' : 'rgba(42,157,143,0.1)',
            color: video.type === 'premium' ? tk.goldDark : tk.teal,
            border: `1px solid ${video.type === 'premium' ? 'rgba(232,168,56,0.25)' : 'rgba(42,157,143,0.2)'}`,
            flexShrink: 0,
          }}>
            {video.type === 'premium' ? '⭐' : '🎬'} {video.type === 'premium' ? 'Premium' : 'Free'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {video.topicName && (
            <span style={{
              fontSize: '11px', fontWeight: 600, color: tk.navy,
              background: 'rgba(27,42,74,0.06)', border: '1px solid rgba(27,42,74,0.12)',
              padding: '2px 8px', borderRadius: '999px',
            }}>{video.topicName}</span>
          )}
          <span style={{ fontSize: '11px', color: tk.faint }}>👁 {video.views || 0}</span>
          <span style={{ fontSize: '11px', color: tk.faint }}>{fmtDateShort(video.createdAt)}</span>
          {video.showOnHomepage && (
            <span style={{
              fontSize: '10px', fontWeight: 700, color: tk.teal,
              background: 'rgba(42,157,143,0.1)', padding: '2px 6px', borderRadius: '999px',
            }}>Home</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <label style={{ position: 'relative', width: '34px', height: '19px', cursor: 'pointer', flexShrink: 0 }}>
          <input type="checkbox" checked={video.isActive} onChange={() => onToggle(video)}
            style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '10px',
            background: video.isActive ? tk.teal : '#E5E7EB', transition: '0.3s',
          }}>
            <div style={{
              position: 'absolute', width: '13px', height: '13px', borderRadius: '50%',
              background: '#fff', top: '3px',
              left: video.isActive ? '18px' : '3px',
              transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
        </label>
        <button onClick={() => onEdit(video)} style={{
          fontSize: '11px', fontWeight: 600, color: tk.navy,
          background: 'rgba(27,42,74,0.06)', border: `1.5px solid rgba(27,42,74,0.12)`,
          cursor: 'pointer', padding: '6px 10px', borderRadius: '7px', fontFamily: 'inherit',
        }}>✏️</button>
        <button onClick={() => onDelete(video._id)} disabled={deleting === video._id} style={{
          fontSize: '11px', fontWeight: 600, color: '#ef4444',
          background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.15)',
          cursor: deleting === video._id ? 'not-allowed' : 'pointer',
          padding: '6px 10px', borderRadius: '7px',
          opacity: deleting === video._id ? 0.5 : 1, fontFamily: 'inherit',
        }}>{deleting === video._id ? '…' : '🗑️'}</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function AdminVideosPage() {
  const [videos, setVideos] = useState([])
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('thumb')
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState('all')
  const [topicFilt, setTopicFilt] = useState('all')
  const [editVideo, setEditVideo] = useState(null)
  const [screenSize, setScreenSize] = useState('desktop') // 'mobile' | 'tablet' | 'desktop'

  const [form, setForm] = useState({
    title: '', description: '', type: 'free', topicId: '',
    order: 0, showOnHomepage: false, playLimit: 3,
    thumbnail: null, video: null, thumbPreview: '',
  })

  useEffect(() => {
    function check() {
      const w = window.innerWidth
      if (w < 640) setScreenSize('mobile')
      else if (w < 1024) setScreenSize('tablet')
      else setScreenSize('desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isMobile = screenSize === 'mobile'
  const isTablet = screenSize === 'tablet'
  const isDesktop = screenSize === 'desktop'

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/videos', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setVideos(data.videos || [])
      else toast.error(data.error || 'Failed to load')
    } catch { toast.error('Network error') }
    setLoading(false)
  }, [])

  const fetchTopics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/topics', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setTopics(data.topics || [])
    } catch { }
  }, [])

  useEffect(() => { fetchVideos(); fetchTopics() }, [])

  const filtered = videos.filter(v => {
    const typeOk = filter === 'all' || v.type === filter
    const topicOk = topicFilt === 'all' || v.topicId === topicFilt
    return typeOk && topicOk
  })

  function resetForm() {
    setForm({
      title: '', description: '', type: 'free', topicId: '',
      order: 0, showOnHomepage: false, playLimit: 3,
      thumbnail: null, video: null, thumbPreview: '',
    })
    setEditVideo(null)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.thumbnail) { toast.error('Thumbnail is required'); return }
    if (!form.video) { toast.error('Video file is required'); return }

    setUploading(true); setUploadProgress(5); setUploadStage('thumb')
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('type', form.type)
      fd.append('topicId', form.topicId)
      fd.append('order', String(form.order))
      fd.append('showOnHomepage', String(form.showOnHomepage))
      fd.append('playLimit', String(form.playLimit))
      fd.append('thumbnail', form.thumbnail)
      fd.append('video', form.video)

      setUploadProgress(20); setUploadStage('video')
      const res = await fetch('/api/admin/videos', { method: 'POST', credentials: 'include', body: fd })
      setUploadProgress(85); setUploadStage('saving')
      const data = await res.json()
      if (data.success) {
        setUploadProgress(100); setUploadStage('done')
        toast.success('✅ Video uploaded!')
        await fetchVideos()
        setTimeout(() => { resetForm(); setShowForm(false) }, 800)
      } else toast.error(data.error || 'Upload failed')
    } catch (err) {
      console.error(err); toast.error('Upload failed. Try again.')
    }
    setTimeout(() => { setUploading(false); setUploadProgress(0); setUploadStage('thumb') }, 1000)
  }

  async function handleEdit(video) {
    setEditVideo(video); setShowForm(true)
    setForm({
      title: video.title, description: video.description || '',
      type: video.type, topicId: video.topicId || '',
      order: video.order || 0, showOnHomepage: video.showOnHomepage || false,
      playLimit: video.playLimit || 3,
      thumbnail: null, video: null, thumbPreview: video.thumbnail || '',
    })
    setTimeout(() => {
      document.querySelector('.vp-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!editVideo) return
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editVideo.id, title: form.title, description: form.description,
          type: form.type, topicId: form.topicId || null,
          order: form.order, showOnHomepage: form.showOnHomepage, playLimit: form.playLimit,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Video updated!')
        await fetchVideos(); resetForm(); setShowForm(false)
      } else toast.error(data.error || 'Update failed')
    } catch { toast.error('Update failed') }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this video permanently?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/videos?id=${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setVideos(prev => prev.filter(v => v._id !== id))
        toast.success('Video deleted')
      } else toast.error(data.error || 'Delete failed')
    } catch { toast.error('Delete failed') }
    setDeleting(null)
  }

  async function toggleActive(video) {
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: video.id, isActive: !video.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        setVideos(prev => prev.map(v => v._id === video._id ? { ...v, isActive: !v.isActive } : v))
        toast.success(video.isActive ? 'Video hidden' : 'Video visible')
      }
    } catch { toast.error('Update failed') }
  }

  const FILTER_TABS = [
    { id: 'all', label: 'All', count: videos.length },
    { id: 'free', label: isMobile ? '🎬' : '🎬 Free', count: videos.filter(v => v.type === 'free').length },
    { id: 'premium', label: isMobile ? '⭐' : '⭐ Premium', count: videos.filter(v => v.type === 'premium').length },
  ]

  const EmptyState = () => (
    <div style={{
      textAlign: 'center', padding: isMobile ? '36px 16px' : '48px 24px',
      background: tk.card,
      ...(isDesktop ? {} : { border: `1.5px solid ${tk.border}`, borderRadius: '14px' }),
    }}>
      <span style={{ fontSize: isMobile ? '36px' : '44px', display: 'block', marginBottom: '10px' }}>🎥</span>
      <p style={{ color: tk.muted, fontWeight: 600, marginBottom: '4px', fontSize: isMobile ? '13px' : '14px' }}>
        No videos found
      </p>
      <p style={{ color: tk.faint, fontSize: '12px' }}>
        {filter !== 'all' || topicFilt !== 'all' ? 'Try changing filters' : 'Upload your first video above'}
      </p>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0 }
          100% { background-position:  200% 0 }
        }
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        *, *::before, *::after { box-sizing: border-box; }

        .vp {
          display: flex; flex-direction: column; gap: 18px;
          animation: fadeInUp .4s ease both;
        }

        /* ── Stats ── */
        .vp-stats { display: flex; gap: 8px; flex-wrap: wrap; }
        .vp-stat {
          padding: 10px 14px; border-radius: 12px;
          background: #fff; border: 1.5px solid ${tk.border};
          display: flex; flex-direction: column; gap: 2px;
          flex: 1; min-width: 72px;
        }
        .vp-stat-val {
          font-size: 19px; font-weight: 800; color: ${tk.navy};
          font-family: 'Playfair Display', serif; line-height: 1;
        }
        .vp-stat-lbl { font-size: 11px; color: ${tk.faint}; font-weight: 500; }

        /* ── Filter ── */
        .vp-tab {
          padding: 7px 12px; border-radius: 9px;
          font-size: 12px; font-weight: 600;
          border: none; cursor: pointer; font-family: inherit;
          transition: all .22s cubic-bezier(.34,1.56,.64,1);
          white-space: nowrap;
        }
        .vp-tab-on {
          background: linear-gradient(135deg,${tk.navy},${tk.navyLight});
          color: #fff; box-shadow: 0 4px 12px rgba(27,42,74,.25);
        }
        .vp-tab-off {
          background: #fff; border: 1.5px solid ${tk.border}; color: ${tk.muted};
        }
        .vp-tab-off:hover {
          color: ${tk.navy}; border-color: rgba(27,42,74,.2);
          transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,.05);
        }
        .vp-tab-count {
          margin-left: 4px;
          background: rgba(255,255,255,.2);
          border-radius: 5px; padding: 1px 5px; font-size: 10px;
        }
        .vp-tab-off .vp-tab-count {
          background: rgba(27,42,74,.08);
          color: ${tk.muted};
        }

        /* ── Form ── */
        .vp-form {
          animation: slideDown .3s ease both;
          position: relative; overflow: hidden;
        }
        .vp-form-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg,${tk.navy},${tk.gold},${tk.navy});
          background-size: 200% 100%; animation: shimmer 2s linear infinite;
        }

        /* ── Grid layouts ── */
        .vp-fg2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .vp-fg3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

        .vp-lbl {
          display: block; font-size: 12px; font-weight: 700;
          color: ${tk.navy}; margin-bottom: 5px; letter-spacing: .3px;
        }
        .vp-opts {
          display: flex; gap: 14px; flex-wrap: wrap; align-items: center;
          padding: 12px 14px; background: rgba(27,42,74,.03);
          border: 1.5px solid #ECEDF0; border-radius: 11px;
        }
        .vp-chk {
          display: flex; align-items: center; gap: 7px;
          cursor: pointer; user-select: none;
        }
        .vp-chk input { accent-color: ${tk.gold}; width: 15px; height: 15px; }
        .vp-chk span  { font-size: 13px; color: ${tk.muted}; font-weight: 500; }

        /* ── Desktop Table ── */
        .vp-table-wrap {
          border-radius: 14px; overflow: hidden;
          border: 1.5px solid ${tk.border}; background: #fff;
        }
        .vp-table { width: 100%; border-collapse: collapse; }
        .vp-table thead tr { background: rgba(27,42,74,.03); }
        .vp-table th {
          padding: 11px 13px; font-size: 10px; font-weight: 700;
          color: ${tk.faint}; text-transform: uppercase; letter-spacing: .7px;
          text-align: left; border-bottom: 1.5px solid ${tk.border};
          white-space: nowrap;
        }
        .vp-table td {
          padding: 11px 13px; font-size: 12px; color: ${tk.muted};
          border-bottom: 1px solid rgba(229,231,235,.6); vertical-align: middle;
        }
        .vp-table tbody tr:last-child td { border-bottom: none; }
        .vp-table tbody tr:hover td { background: rgba(27,42,74,.012); }

        .vp-thumb {
          width: 52px; height: 33px; border-radius: 6px;
          object-fit: cover; border: 1.5px solid ${tk.border}; flex-shrink: 0;
        }
        .vp-thumb-ph {
          width: 52px; height: 33px; border-radius: 6px;
          background: rgba(27,42,74,.06); display: flex;
          align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0; border: 1.5px solid ${tk.border};
        }
        .vp-title-cell {
          font-size: 12px; font-weight: 600; color: ${tk.text};
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .vp-act-edit {
          font-size: 11px; font-weight: 600; color: ${tk.navy};
          background: none; border: 1.5px solid transparent;
          cursor: pointer; padding: 4px 8px; border-radius: 7px;
          transition: all .2s; font-family: inherit;
        }
        .vp-act-edit:hover { background: rgba(27,42,74,.07); border-color: rgba(27,42,74,.15); }
        .vp-act-del {
          font-size: 11px; font-weight: 600; color: #ef4444;
          background: none; border: 1.5px solid transparent;
          cursor: pointer; padding: 4px 8px; border-radius: 7px;
          transition: all .2s; font-family: inherit;
        }
        .vp-act-del:hover:not(:disabled) { background: rgba(239,68,68,.07); border-color: rgba(239,68,68,.2); }
        .vp-act-del:disabled { opacity: .4; cursor: not-allowed; }

        .vp-toggle {
          position: relative; display: inline-block; width: 34px; height: 19px; cursor: pointer;
        }
        .vp-toggle input { opacity: 0; width: 0; height: 0; }
        .vp-toggle-slider {
          position: absolute; inset: 0; border-radius: 10px; background: #E5E7EB; transition: .3s;
        }
        .vp-toggle input:checked + .vp-toggle-slider { background: ${tk.teal}; }
        .vp-toggle-slider::before {
          content: ''; position: absolute; width: 13px; height: 13px;
          border-radius: 50%; background: #fff; left: 3px; top: 3px; transition: .3s;
          box-shadow: 0 1px 3px rgba(0,0,0,.2);
        }
        .vp-toggle input:checked + .vp-toggle-slider::before { transform: translateX(15px); }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .vp-fg3 { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .vp { gap: 14px; }
          .vp-fg2, .vp-fg3 { grid-template-columns: 1fr; gap: 10px; }
          .vp-opts { gap: 10px; }
          .vp-stats { gap: 6px; }
          .vp-stat { min-width: 64px; padding: 8px 10px; }
          .vp-stat-val { font-size: 16px; }
          .vp-stat-lbl { font-size: 10px; }
        }
        @media (max-width: 380px) {
          .vp-stats { display: grid; grid-template-columns: 1fr 1fr; }
          .vp-stat { min-width: unset; }
        }
      `}</style>

      <div className="vp">

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{
              fontFamily: 'Playfair Display,serif', fontWeight: 800,
              fontSize: 'clamp(17px,3vw,23px)', color: tk.text, marginBottom: '3px',
            }}>🎬 Video Manager</h1>
            <p style={{ color: tk.muted, fontSize: '12px' }}>
              {isMobile ? 'Manage videos' : 'Upload and manage topic-wise videos'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={fetchVideos} disabled={loading} className="adm-btn-secondary" title="Refresh">
              <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            </button>
            <button
              onClick={() => { setShowForm(s => !s); if (showForm) resetForm() }}
              className="adm-btn-primary"
            >
              {showForm ? '✕ Close' : `+ ${isMobile ? 'Upload' : 'Upload Video'}`}
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="vp-stats">
          {[
            { val: videos.length, lbl: 'Total' },
            { val: videos.filter(v => v.type === 'free').length, lbl: 'Free' },
            { val: videos.filter(v => v.type === 'premium').length, lbl: 'Premium' },
            { val: topics.length, lbl: 'Topics' },
            { val: videos.reduce((s, v) => s + (v.views || 0), 0), lbl: 'Views' },
          ].map(s => (
            <div key={s.lbl} className="vp-stat">
              <div className="vp-stat-val">
                {loading
                  ? <div style={{ height: '16px', width: '32px', borderRadius: '5px', background: '#F0F1F3' }} />
                  : s.val}
              </div>
              <div className="vp-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Form ── */}
        {showForm && (
          <div className="adm-card vp-form" style={{ paddingTop: '24px' }}>
            <div className="vp-form-bar" />
            <h3 style={{ fontWeight: 700, color: tk.text, fontSize: '14px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              {editVideo ? '✏️ Edit Video' : '⬆️ Upload New Video'}
            </h3>

            <form onSubmit={editVideo ? handleUpdate : handleUpload}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Row 1 */}
              <div className="vp-fg2">
                <div>
                  <label className="vp-lbl">Title <span style={{ color: tk.gold }}>*</span></label>
                  <input type="text" className="adm-input" placeholder="Enter video title"
                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    disabled={uploading} required />
                </div>
                <div>
                  <label className="vp-lbl">Type <span style={{ color: tk.gold }}>*</span></label>
                  <select className="adm-input" value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })} disabled={uploading}>
                    <option value="free">🎬 Free</option>
                    <option value="premium">⭐ Premium</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="vp-fg3">
                <div>
                  <label className="vp-lbl">Topic</label>
                  <select className="adm-input" value={form.topicId}
                    onChange={e => setForm({ ...form, topicId: e.target.value })} disabled={uploading}>
                    <option value="">— No Topic —</option>
                    {topics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="vp-lbl">Order</label>
                  <input type="number" className="adm-input" value={form.order} min={0}
                    onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    disabled={uploading} />
                </div>
                <div>
                  <label className="vp-lbl">
                    Play Limit
                    <span style={{ color: tk.faint, fontWeight: 400, marginLeft: '3px' }}>(per user)</span>
                  </label>
                  <input type="number" className="adm-input" value={form.playLimit} min={1} max={10}
                    onChange={e => setForm({ ...form, playLimit: parseInt(e.target.value) || 3 })}
                    disabled={uploading} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="vp-lbl">Description</label>
                <textarea className="adm-input" rows={2}
                  placeholder="Brief description…"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  disabled={uploading}
                  style={{ resize: 'vertical', minHeight: '60px' }} />
              </div>

              {/* Files — new upload only */}
              {!editVideo && (
                <div className="vp-fg2">
                  <FileDropZone
                    label="Thumbnail" accept="image/jpeg,image/png,image/webp"
                    hint="Max 5MB" file={form.thumbnail} preview={form.thumbPreview}
                    maxSizeMB={5} disabled={uploading}
                    onChange={f => setForm({ ...form, thumbnail: f, thumbPreview: URL.createObjectURL(f) })}
                  />
                  <FileDropZone
                    label="Video File" accept="video/mp4,video/webm,video/*"
                    hint="Max 500MB" file={form.video}
                    maxSizeMB={500} disabled={uploading}
                    onChange={f => setForm({ ...form, video: f })}
                  />
                </div>
              )}

              {/* Edit: existing thumbnail */}
              {editVideo && form.thumbPreview && (
                <div>
                  <label className="vp-lbl">Current Thumbnail</label>
                  <img src={form.thumbPreview} alt="Thumbnail" style={{
                    height: '72px', borderRadius: '9px', objectFit: 'cover',
                    border: `1.5px solid ${tk.border}`,
                  }} />
                </div>
              )}

              {/* Options */}
              <div className="vp-opts">
                <label className="vp-chk">
                  <input type="checkbox" checked={form.showOnHomepage}
                    onChange={e => setForm({ ...form, showOnHomepage: e.target.checked })}
                    disabled={uploading} />
                  <span>Show on Homepage</span>
                </label>
                {form.type === 'premium' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '5px 11px', borderRadius: '9px',
                    background: 'rgba(232,168,56,0.08)', border: '1px solid rgba(232,168,56,0.2)',
                  }}>
                    <span>🔒</span>
                    <span style={{ fontSize: '12px', color: tk.muted, fontWeight: 500 }}>
                      <strong style={{ color: tk.gold }}>{form.playLimit}</strong> plays max
                    </span>
                  </div>
                )}
              </div>

              {uploading && <UploadProgress progress={uploadProgress} stage={uploadStage} />}

              {/* Submit */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="submit" disabled={uploading} className="adm-btn-primary"
                  style={{ padding: '11px 24px' }}>
                  {uploading ? (
                    <>
                      <svg style={{
                        width: '13px', height: '13px', animation: 'spin 1s linear infinite',
                        display: 'inline-block', marginRight: '6px', verticalAlign: 'middle',
                      }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {editVideo ? 'Saving…' : 'Uploading…'}
                    </>
                  ) : editVideo ? '💾 Save Changes' : '⬆️ Upload'}
                </button>
                <button type="button" disabled={uploading}
                  onClick={() => { resetForm(); setShowForm(false) }}
                  className="adm-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {FILTER_TABS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`vp-tab ${filter === f.id ? 'vp-tab-on' : 'vp-tab-off'}`}>
                {f.label}
                <span className="vp-tab-count">{f.count}</span>
              </button>
            ))}
            <select className="adm-input"
              style={{ width: 'auto', minWidth: isMobile ? '110px' : '130px', fontSize: '12px', padding: '6px 9px' }}
              value={topicFilt} onChange={e => setTopicFilt(e.target.value)}>
              <option value="all">All Topics</option>
              {topics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <span style={{ fontSize: '11px', color: tk.faint, whiteSpace: 'nowrap' }}>
            {filtered.length} video{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Content Area ── */}
        {isMobile ? (
          /* Mobile: Cards */
          <div>
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{
                  height: '155px', borderRadius: '14px', marginBottom: '10px',
                  background: 'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
                }} />
              ))
            ) : filtered.length === 0 ? <EmptyState />
              : filtered.map(video => (
                <MobileVideoCard key={video._id} video={video}
                  onEdit={handleEdit} onDelete={handleDelete}
                  onToggle={toggleActive} deleting={deleting} />
              ))
            }
          </div>
        ) : isTablet ? (
          /* Tablet: Compact Cards */
          <div style={{
            background: tk.card, border: `1.5px solid ${tk.border}`,
            borderRadius: '14px', overflow: 'hidden',
            padding: '12px',
          }}>
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  height: '76px', borderRadius: '10px', marginBottom: '8px',
                  background: 'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
                }} />
              ))
            ) : filtered.length === 0 ? <EmptyState />
              : filtered.map(video => (
                <TabletVideoCard key={video._id} video={video}
                  onEdit={handleEdit} onDelete={handleDelete}
                  onToggle={toggleActive} deleting={deleting} />
              ))
            }
          </div>
        ) : (
          /* Desktop: Full Table */
          <div className="vp-table-wrap">
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="vp-table" style={{ minWidth: '750px' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '200px' }}>Video</th>
                    <th>Type</th>
                    <th>Topic</th>
                    <th>Plays</th>
                    <th>Views</th>
                    <th>Active</th>
                    <th>Added</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
                    : filtered.length === 0
                      ? (
                        <tr>
                          <td colSpan={8}>
                            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                              <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🎥</span>
                              <p style={{ color: tk.muted, fontWeight: 600, marginBottom: '4px' }}>No videos found</p>
                              <p style={{ color: tk.faint, fontSize: '12px' }}>
                                {filter !== 'all' || topicFilt !== 'all' ? 'Try changing filters' : 'Upload your first video above'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )
                      : filtered.map(video => (
                        <tr key={video._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {video.thumbnail
                                ? <img src={video.thumbnail} alt="" className="vp-thumb" />
                                : <div className="vp-thumb-ph">🎥</div>
                              }
                              <div style={{ minWidth: 0 }}>
                                <p className="vp-title-cell" style={{ maxWidth: '180px' }}>{video.title}</p>
                                {video.showOnHomepage && (
                                  <span style={{
                                    display: 'inline-block', marginTop: '3px',
                                    fontSize: '9px', fontWeight: 700, color: tk.teal,
                                    background: 'rgba(42,157,143,.1)', border: '1px solid rgba(42,157,143,.2)',
                                    padding: '1px 6px', borderRadius: '999px',
                                  }}>Homepage</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '3px',
                              padding: '3px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
                              background: video.type === 'premium' ? 'rgba(232,168,56,.12)' : 'rgba(42,157,143,.1)',
                              color: video.type === 'premium' ? tk.goldDark : tk.teal,
                              border: `1px solid ${video.type === 'premium' ? 'rgba(232,168,56,.25)' : 'rgba(42,157,143,.2)'}`,
                            }}>
                              {video.type === 'premium' ? '⭐ Premium' : '🎬 Free'}
                            </span>
                          </td>
                          <td>
                            {video.topicName
                              ? <span style={{
                                padding: '2px 8px', borderRadius: '999px', fontSize: '11px',
                                fontWeight: 600, color: tk.navy, background: 'rgba(27,42,74,.06)',
                                border: '1px solid rgba(27,42,74,.12)',
                              }}>{video.topicName}</span>
                              : <span style={{ color: '#D1D5DB' }}>—</span>}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '11px', fontWeight: 700,
                              color: video.type === 'premium' ? tk.gold : tk.faint,
                            }}>
                              {video.type === 'premium' ? `🔒 ${video.playLimit || 3}` : '∞'}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              background: 'rgba(27,42,74,.04)', borderRadius: '5px',
                              padding: '2px 7px', fontSize: '11px', fontWeight: 600, color: tk.muted,
                            }}>{video.views || 0}</span>
                          </td>
                          <td>
                            <label className="vp-toggle">
                              <input type="checkbox" checked={video.isActive} onChange={() => toggleActive(video)} />
                              <span className="vp-toggle-slider" />
                            </label>
                          </td>
                          <td style={{ fontSize: '11px', color: tk.faint, whiteSpace: 'nowrap' }}>
                            {fmtDate(video.createdAt)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleEdit(video)} className="vp-act-edit">✏️</button>
                              <button onClick={() => handleDelete(video._id)}
                                disabled={deleting === video._id} className="vp-act-del">
                                {deleting === video._id ? '…' : '🗑️'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  )
}